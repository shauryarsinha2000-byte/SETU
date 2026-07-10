import { requireRole } from "../../../lib/auth.js";
import { sb } from "../../../lib/db.js";

// PATCH /api/cases/:id/evidence  { records?, conversation?, history? }  -> merges onto cases.evidence
export default async function handler(req, res) {
  const gate = requireRole(req, null);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
  if (req.method !== "PATCH") return res.status(405).json({ error: "PATCH only" });
  const id = req.query.id;
  try {
    const rows = await sb("cases?id=eq." + id + "&select=evidence");
    const cur = (rows && rows[0] && rows[0].evidence) || {};
    const b = req.body || {};
    const merged = { ...cur };
    if (b.records) merged.records = { ...(cur.records || {}), ...b.records };
    if (b.conversation) merged.conversation = { ...(cur.conversation || {}), ...b.conversation };
    if (b.history) merged.history = { ...(cur.history || {}), ...b.history };
    const out = await sb("cases?id=eq." + id, { method: "PATCH", body: { evidence: merged } });
    return res.status(200).json({ case: Array.isArray(out) ? out[0] : out });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
