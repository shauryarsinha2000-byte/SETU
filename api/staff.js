import { requireRole, normalizePhone } from "../lib/auth.js";
import { sb } from "../lib/db.js";

// GET  /api/staff        -> list staff (admin)
// POST /api/staff {name, phone, role, qualification} -> invite/create (admin)
export default async function handler(req, res) {
  const gate = requireRole(req, ["admin"]);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });

  try {
    if (req.method === "GET") {
      const rows = await sb("profiles?select=id,name,phone,role,qualification,active&order=created_at.desc");
      return res.status(200).json({ staff: rows });
    }
    if (req.method === "POST") {
      const { name, phone, role, qualification } = req.body || {};
      const p = normalizePhone(phone);
      if (!name || p.length < 10 || !role) return res.status(400).json({ error: "name, valid phone, and role are required" });
      const validRoles = ["admin", "receptionist", "gp", "specialist", "counselor"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "invalid role" });
      const rows = await sb("profiles", {
        method: "POST",
        body: { name, phone: p, role, qualification: qualification || "none", active: true },
        prefer: "return=representation,resolution=merge-duplicates",
      });
      return res.status(200).json({ profile: Array.isArray(rows) ? rows[0] : rows });
    }
    return res.status(405).json({ error: "GET or POST" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
