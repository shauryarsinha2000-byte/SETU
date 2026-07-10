# SETU — Auth + Database setup (Slice 1)

This adds a real login gate (demo OTP), five roles, and a Supabase database. Do these once.

## 1. Create a Supabase project
1. Go to https://supabase.com → sign in → **New project**.
2. Name it `setu`, choose a region near you (Mumbai / Singapore), set + save a DB password.
3. Wait ~2 minutes for it to provision.

## 2. Run the schema
1. In Supabase → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, paste the whole thing, click **Run**.
3. It creates the tables, turns on row-level security, and seeds:
   - clinical thresholds, and
   - the first Admin: **Shaurya · 7016416673**.

## 3. Grab your keys
Supabase → **Project Settings → API**, copy:
- **Project URL**
- **service_role key** (secret — server only)
- **anon public key** (optional)

## 4. Add environment variables in Vercel
Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | your Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
| `SESSION_SECRET` | any long random string (e.g. from `openssl rand -hex 32`) |
| `SUPABASE_ANON_KEY` | anon key *(optional)* |
| `DEMO_OTP` | *(optional)* defaults to `123456` |

(Keep the existing `ANTHROPIC_API_KEY` and `SARVAM_API_KEY`.)

Then **Deployments → Redeploy** so the new vars take effect.

## 5. Log in
- Open your app URL. You'll see the **Sign in** screen.
- Enter **7016416673** → Send OTP → enter **123456** → you're in as Admin.
- Each role sees only its own tabs (Admin sees all).

## How auth works (and its limit)
- The browser never touches the database. It calls `/api/*`, which use the **service-role key**
  server-side. RLS is on with no anon policies, so the anon key can't read/write anything directly.
- Login: `/api/auth/verify-otp` checks the demo code, looks up the staff profile by phone, and
  issues a signed token (HMAC, `SESSION_SECRET`). The frontend stores it and sends it as a Bearer token.
- **Demo OTP is NOT production security.** The code is fixed and known. Before real staff/patients,
  swap to true phone-OTP (add Twilio/MSG91 to Supabase Auth) or email magic-link. Everything else
  (roles, RLS, data model) is already real.

## What's next (Slices 2–4, not in this drop yet)
- **Slice 2** — persist the flow: reception → doctor → specialist → counselor read/write the *same*
  case row (this is where the AI evidence accumulates instead of being re-entered).
- **Slice 3** — fused `analyze-case`: records + conversation + history + your thresholds → one verdict.
- **Slice 4** — the threshold admin panel (edits the `settings` row; the numbers flow into the AI prompt).

The `cases.evidence` JSON column and the `settings.thresholds` row already exist for exactly this.
