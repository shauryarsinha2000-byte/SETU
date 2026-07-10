import { analyzeVerdict } from "../lib/analyze.js";
import { sb } from "../lib/db.js";

// Stateless fused analysis. Accepts { records, conversation, history, patient, thresholds? }.
// If thresholds aren't passed, it loads the clinic's configured thresholds from the DB.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { patient, records, conversation, history, thresholds } = req.body || {};
    let thr = thresholds;
    if (!thr) {
      try {
        const st = await sb("settings?id=eq.clinical&select=thresholds");
        thr = (st && st[0] && st[0].thresholds) || {};
      } catch (_) { thr = {}; }
    }
    const verdict = await analyzeVerdict({ patient, records, conversation, history, thresholds: thr });
    if (!verdict) return res.status(200).json({ error: "Could not parse model output" });
    return res.status(200).json(verdict);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
