# SETU — Hub-and-Spoke IVF Network (real AI)

A mobile-first, cross-platform web app for an AI-native IVF network: reception intake, a GP
doctor console, a hub specialist approval queue, and a counselor onboarding view. The AI is
**real** — Claude reads uploaded reports and produces the diagnosis; Sarvam transcribes and
translates the Hindi/Gujarati consultation.

> **Clinical & legal note.** The AI is **advisory only**. Every diagnosis is provisional and must be
> signed off by a qualified hub clinician before anything reaches a patient. Thresholds are FOGSI/WHO-aligned
> defaults and must be validated by a practising gynaecologist before real patient use. Patient data is
> health data — handle per India's DPDP Act.

---

## What's real vs demo

- **Real (calls live APIs):**
  - Doctor Console → **"⚡ Run live AI diagnosis (Claude)"** → `/api/analyze-case`
  - Front Desk → **"📷 Upload a real report → live AI"** (Claude vision) → `/api/extract-report`
  - Doctor Console → **"● Record LIVE (mic → Sarvam + Claude)"** → `/api/transcribe` + `/api/analyze-conversation`
- **Demo (scripted, always works — your safety net for a live presentation):** the mock MedGemma scan,
  the scripted voice pipeline, the seeded patients, and the guided tour.

Both live and demo paths coexist, so the app still demos perfectly even before keys are set.

---

## Deploy (GitHub → Vercel), ~10 minutes

### 0. Rotate your keys first
The keys you shared earlier are compromised — generate **new** ones:
- Anthropic: https://console.anthropic.com → API Keys → create new
- Sarvam: dashboard → API keys → regenerate

Never paste keys into code, chat, or the `public/` folder.

### 1. Push this folder to GitHub
```bash
cd setu-app
git init
git add .
git commit -m "SETU app: real AI backend + mobile-first frontend"
git branch -M main
git remote add origin https://github.com/<you>/setu-app.git
git push -u origin main
```

### 2. Import to Vercel
- Go to https://vercel.com → **Add New → Project** → import your `setu-app` repo.
- Framework preset: **Other** (no build step needed). Leave defaults.

### 3. Add environment variables (this is where the keys live — safely)
Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your new Anthropic key |
| `SARVAM_API_KEY` | your new Sarvam key |
| `CLAUDE_MODEL` | *(optional)* `claude-sonnet-4-6` |

Apply to Production (and Preview if you want). Then **Deployments → Redeploy** so the functions pick them up.

### 4. Open the app
- Frontend: `https://<your-project>.vercel.app/`
- APIs live at `/api/analyze-case`, `/api/extract-report`, `/api/transcribe`, `/api/analyze-conversation`.

### Test it
- Doctor Console → **Run live AI diagnosis** → should return a real Claude diagnosis for the current patient.
- Front Desk → New patient → **Upload a real report** → pick a photo/PDF of a lab report → Claude reads it.
- Doctor Console → **Record LIVE** → speak in Hindi/Gujarati → Sarvam translates, Claude extracts findings.

---

## Local development (optional)
```bash
npm i -g vercel
vercel dev            # runs frontend + /api routes locally
# add the same env vars via `vercel env add` or a local .env (never commit it)
```

## Project structure
```
setu-app/
├─ api/
│  ├─ analyze-case.js          # Claude → diagnosis / tests / treatment (JSON)
│  ├─ extract-report.js        # Claude vision → structured labs from a report
│  ├─ transcribe.js            # Sarvam → Indic speech-to-text + English translation
│  └─ analyze-conversation.js  # Claude → findings from the translated transcript
├─ lib/ai.js                   # shared Claude fetch helper + JSON parser
├─ public/index.html           # the whole frontend (mobile-first, single file)
├─ package.json                # ESM, Node >=18
├─ vercel.json                 # function maxDuration
└─ .env.example                # variable names only
```

## Notes / gotchas
- **Keys never touch the browser.** The frontend calls `/api/*`; only the serverless functions read the keys from env. That's the whole reason for the backend.
- **Request size:** serverless requests are capped (~4.5 MB). Keep report photos and audio clips reasonable; compress very large scans.
- **Model:** default `claude-sonnet-4-6` (fast, strong vision). Set `CLAUDE_MODEL` to `claude-opus-4-8` for maximum reasoning if you want.
- **Sarvam model string** is `saaras:v2.5` in `api/transcribe.js` — if Sarvam updates versions, change it there.
- **Auth is not built yet.** Anyone with the URL can use it. This is the deliberate "AI-first tonight, login gate second" order. Phone-OTP + roles (Supabase) is the immediate next step.

## Next (fast-follow after tonight)
1. Supabase: phone-OTP auth, five roles, row-level security, persisted cases/referrals/onboarding, audit log.
2. Real lab-partner upload portal + WhatsApp Business API for the counselor.
3. Admin panel to tune clinical thresholds (currently in the `analyze-case` system prompt).
