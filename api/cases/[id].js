import { requireRole } from "../../lib/auth.js";
import { sb } from "../../lib/db.js";

export default async function handler(req, res) {
  const gate = requireRole(req, null);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
  const id = req.query.id;
  try {
    if (req.method === "GET") {
      const rows = await sb("cases?id=eq." + id + "&select=*,patient:patients(*)");
      return res.status(200).json({ case: rows && rows[0] });
    }
    if (req.method === "PATCH") {
      const b = req.body || {};
      const allow = ["status", "doctor_note", "specialist_note", "referral", "locus", "onboarding", "assigned_gp"];
      const upd = {};
      allow.forEach((k) => { if (k in b) upd[k] = b[k]; });
      const rows = await sb("cases?id=eq." + id, { method: "PATCH", body: upd });
      return res.status(200).json({ case: Array.isArray(rows) ? rows[0] : rows });
    }
    return res.status(405).json({ error: "GET or PATCH" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
