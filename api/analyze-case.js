import { claude, extractJSON } from "../lib/ai.js";

const SYSTEM = `You are a clinical decision-support engine for a hub-and-spoke IVF network in India.
You are ADVISORY ONLY. Every output is PROVISIONAL and must be signed off by a hub reproductive
endocrinologist; a generalist at the spoke never acts without that sign-off. Follow FOGSI / WHO-aligned
first-line infertility logic.

Return ONLY a JSON object (no prose, no markdown fences) with these keys:
{
  "diagnosis": "one clear sentence",
  "testsRequired": [{ "name": "...", "status": "present|missing|advised", "note": "..." }],
  "treatment": ["short step", "..."],
  "locus": "spoke|hub",
  "referral": "e.g. IVF-ICSI | IUI at hub | Ovulation induction (spoke) | Surgery first | Specialist",
  "redFlags": ["any sure-referral factors found"],
  "timeSensitive": true|false
}

Routing rules (thresholds are configurable defaults — treat borderline values with care):
- ANY of these => refer to HUB: low AMH (<1.2 ng/mL), azoospermia, both tubes blocked, hydrosalpinx,
  age >=40 or very low reserve, severe male factor (total motile sperm count <5M).
- Uterine cavity lesion (polyp/fibroid/septum/adhesions) => SURGERY first, then continue.
- Anovulation (irregular cycles/PCOS) + at least one patent tube + adequate semen => SPOKE oral ovulation induction.
- Ovulatory + patent tubes + mild male factor or unexplained => IUI at hub.
- Correct thyroid / prolactin / weight first where relevant.
- All treatment runs under hub sign-off; azoospermia/very low reserve/TB/recurrent loss are mandatory hub review.

Output ONLY the raw JSON object. No explanation, no preamble, no markdown code fences. Your entire response must start with { and end with }.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { patient } = req.body || {};
    if (!patient) return res.status(400).json({ error: "patient object required" });
    const user = `Patient case (JSON):\n${JSON.stringify(patient, null, 2)}\n\nReturn ONLY the JSON object described.`;
    const text = await claude({ system: SYSTEM, messages: [{ role: "user", content: user }], max_tokens: 1200 });
    const json = extractJSON(text);
    if (!json) return res.status(200).json({ error: "Could not parse model output", raw: text });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
