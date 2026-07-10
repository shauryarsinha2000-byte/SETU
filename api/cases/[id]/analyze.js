import { requireRole } from "../../../lib/auth.js";
import { sb } from "../../../lib/db.js";
import { analyzeVerdict } from "../../../lib/analyze.js";

// POST /api/cases/:id/analyze -> reads the case's accumulated evidence + clinic thresholds,
// fuses them via Claude, saves ai_verdict onto the case, returns the verdict.
export default async function handler(req, res) {
  const gate = requireRole(req, ["gp", "specialist", "admin"]);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const id = req.query.id;
  try {
    const rows = await sb("cases?id=eq." + id + "&select=*");
    const c = rows && rows[0];
    if (!c) return res.status(404).json({ error: "case not found" });

    let thresholds = {};
    try {
      const st = await sb("settings?id=eq.clinical&select=thresholds");
      thresholds = (st && st[0] && st[0].thresholds) || {};
    } catch (_) {}

    const ev = c.evidence || {};
    const verdict = await analyzeVerdict({
      records: ev.records, conversation: ev.conversation, history: ev.history, thresholds,
    });
    if (!verdict) return res.status(200).json({ error: "could not parse verdict" });

    await sb("cases?id=eq." + id, {
      method: "PATCH",
      body: { ai_verdict: verdict, locus: verdict.locus || null, referral: verdict.referral || null },
    });
    return res.status(200).json({ verdict });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
