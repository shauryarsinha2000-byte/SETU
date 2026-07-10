-- ============================================================
--  SETU — database schema (run once in Supabase → SQL Editor)
-- ============================================================
-- Auth model: our serverless API authenticates (demo OTP) and talks to
-- Postgres with the SERVICE ROLE key, which BYPASSES RLS. We enable RLS
-- with NO anon policies, so the browser (anon key) can never read/write
-- the tables directly — every access goes through our API.

-- enums (idempotent)
do $$ begin create type setu_role as enum ('admin','receptionist','gp','specialist','counselor'); exception when duplicate_object then null; end $$;
do $$ begin create type setu_qual as enum ('mbbs','md','bams','bds','none'); exception when duplicate_object then null; end $$;
do $$ begin create type case_status as enum ('intake','doctor','hub_review','onboarding','closed'); exception when duplicate_object then null; end $$;

-- staff / users
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  role setu_role not null,
  qualification setu_qual not null default 'none',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  partner_age int,
  bmi text,
  location text,
  married text,
  complaint text,
  clinic text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- one case per patient journey; evidence accumulates across the flow
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  status case_status not null default 'intake',
  evidence jsonb not null default '{}'::jsonb,   -- { records:{labs,hsg}, conversation:{findings,transcript,mergeNote,language}, history:{} }
  ai_verdict jsonb,                              -- fused diagnosis (records + conversation + history + thresholds)
  doctor_note text,
  specialist_note text,
  locus text,
  referral text,
  onboarding jsonb not null default '{"checklist":[false,false,false,false,false]}'::jsonb,
  assigned_gp uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- editable clinical thresholds (admin panel)
create table if not exists settings (
  id text primary key default 'clinical',
  thresholds jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  action text not null,
  case_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- keep updated_at fresh on cases
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists cases_touch on cases;
create trigger cases_touch before update on cases for each row execute function touch_updated_at();

-- RLS on, no anon policies => browser cannot touch data; service role bypasses
alter table profiles  enable row level security;
alter table patients  enable row level security;
alter table cases     enable row level security;
alter table settings  enable row level security;
alter table audit_log enable row level security;

-- ---------- seed ----------
insert into settings (id, thresholds) values ('clinical', '{
  "amhLow": 1.2, "fshHigh": 12, "afcLow": 5,
  "semenConc": 16, "semenMotility": 42, "semenProgressive": 30, "semenMorph": 4,
  "tmscSevere": 5, "ageExpedite": 40, "oiCycleCap": 6
}'::jsonb)
on conflict (id) do nothing;

-- first Admin (demo OTP is 123456 — see README)
insert into profiles (phone, name, role, qualification, active)
values ('7016416673', 'Shaurya', 'admin', 'none', true)
on conflict (phone) do nothing;
