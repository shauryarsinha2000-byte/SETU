import { requireRole } from "../lib/auth.js";
import { sb } from "../lib/db.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const gate = requireRole(req, null);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
      const st = await sb("settings?id=eq.clinical&select=thresholds");
      return res.status(200).json({ thresholds: (st && st[0] && st[0].thresholds) || {} });
    }
    if (req.method === "PATCH") {
      const gate = requireRole(req, ["admin"]);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
      const b = req.body || {};
      const out = await sb("settings?id=eq.clinical", {
        method: "PATCH",
        body: { thresholds: b.thresholds, updated_by: gate.session.sub, updated_at: new Date().toISOString() },
      });
      return res.status(200).json({ thresholds: Array.isArray(out) ? out[0].thresholds : b.thresholds });
    }
    return res.status(405).json({ error: "GET or PATCH" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
