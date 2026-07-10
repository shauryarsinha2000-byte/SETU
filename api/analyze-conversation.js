import { claude, extractJSON } from "../lib/ai.js";

const SYSTEM = `You extract structured infertility history from a translated doctor-patient consultation.
Return ONLY JSON (no prose, no fences):
{
  "findings": ["short chip-style strings a clinician would note"],
  "history": {
    "duration": "", "primaryOrSecondary": "", "cycles": "", "coitalFrequency": "",
    "priorPregnancy": "", "priorTreatment": "", "tbOrPidHistory": ""
  },
  "mergeNote": "one sentence on how these findings change or confirm the plan"
}
Only fill fields the transcript supports; leave others as empty strings. Be concise and clinical.

Output ONLY the raw JSON object. No explanation, no preamble, no markdown code fences. Your entire response must start with { and end with }.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { transcript, existing } = req.body || {};
    if (!transcript) return res.status(400).json({ error: "transcript required" });
    const user =
      `Translated consultation transcript:\n"""${transcript}"""\n\n` +
      `Existing structured records (optional context): ${JSON.stringify(existing || {})}\n\n` +
      `Return ONLY the JSON object described.`;
    const text = await claude({ system: SYSTEM, messages: [{ role: "user", content: user }], max_tokens: 900 });
    const json = extractJSON(text);
    if (!json) return res.status(200).json({ error: "Could not parse model output", raw: text });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
