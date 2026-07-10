# SETU — Persistence + Fused AI (Slices 2 & 3)

Builds on the auth/database setup. **No new environment variables** — it uses the Supabase
env you already added.

## One-time: seed demo cases (optional but recommended)
So the doctor/hub/onboarding screens have real rows to work with:
1. Supabase → **SQL Editor** → New query.
2. Paste `supabase/seed.sql`, click **Run**. (Run it once. It inserts Meena, Kavita, Rekha, Anjali as real patients+cases.)

## What's new

### The fused verdict (your ask)
- **Doctor Console → ⚡ Run live AI diagnosis** now sends the **whole case** to Claude:
  the extracted **records** + the **conversation** findings (run the consultation first to add them)
  + the **history** — and the server adds your configured **thresholds** from the `settings` table.
  Claude fuses all of it into one verdict and returns a `fusionNote` naming what the conversation added.
- Nothing is analysed in isolation anymore.

### Persistence (the case now lives in the database)
New role-gated endpoints:
- `POST /api/cases` — reception creates a patient + case (Front Desk → upload real report → **Save + send to doctor's queue**).
- `GET /api/cases?queue=doctor|hub_review|onboarding` — role-scoped queues.
- `PATCH /api/cases/:id` — status, notes, referral, onboarding checklist.
- `PATCH /api/cases/:id/evidence` — append records / conversation / history onto the case.
- `POST /api/cases/:id/analyze` — re-run the fused verdict on a **stored** case and save `ai_verdict`.

### See it end-to-end
1. Log in as **Admin** (7016416673 / 123456) or a Receptionist.
2. **Front Desk → New patient → Upload a real report** (Claude reads it) → **Save + send to doctor's queue**.
3. **Doctor Console → Live queue (DB)** → your saved case appears → **⚡ Fuse + analyse** → verdict is
   computed from the case's stored evidence + thresholds and **saved back** to the case.

## Settings / thresholds
- `GET /api/settings` returns the current thresholds; `PATCH /api/settings` (admin) updates them.
- These numbers flow straight into the AI prompt, so tuning them changes the AI's routing —
  the admin **panel UI** for editing them is the last remaining piece (Slice 4).

## Honest status
- Auth, schema, login, role routing, and the **fused diagnosis payload** are tested and verified.
- The database-backed endpoints (cases CRUD, save, live queue, stored-case analyze) are written and
  syntax-clean, but I could not run them against your live Supabase from here — so the first time you
  click **Save** and **Live queue**, watch for any error toast. If one appears, open dev-tools →
  Network → the failing request → Response, paste it to me, and I'll turn the fix fast (usually a
  column name or a role filter).
