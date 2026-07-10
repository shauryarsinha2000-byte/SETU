import { requireRole } from "../../lib/auth.js";
import { sb } from "../../lib/db.js";

// Which statuses each role sees by default
const QUEUE = {
  gp: ["doctor", "intake"],
  receptionist: ["intake", "doctor"],
  specialist: ["hub_review"],
  counselor: ["onboarding"],
  admin: null, // all
};

export default async function handler(req, res) {
  const gate = requireRole(req, null);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
  const role = gate.session.role;
  try {
    if (req.method === "GET") {
      const q = req.query.queue;
      const statuses = q && q !== "all" ? [q] : QUEUE[role];
      const filter = statuses ? "&status=in.(" + statuses.join(",") + ")" : "";
      const rows = await sb("cases?select=*,patient:patients(*)" + filter + "&order=updated_at.desc");
      return res.status(200).json({ cases: rows });
    }
    if (req.method === "POST") {
      if (!["receptionist", "admin"].includes(role)) return res.status(403).json({ error: "reception/admin only" });
      const b = req.body || {};
      const pt = await sb("patients", {
        method: "POST",
        body: {
          name: b.name || "New Patient", age: b.age ?? null, partner_age: b.partnerAge ?? null,
          bmi: b.bmi ?? null, location: b.location ?? null, married: b.married ?? null,
          complaint: b.complaint ?? null, clinic: b.clinic ?? null, created_by: gate.session.sub,
        },
      });
      const patient = Array.isArray(pt) ? pt[0] : pt;
      const cs = await sb("cases", {
        method: "POST",
        body: { patient_id: patient.id, status: "doctor", evidence: b.evidence || {}, created_by: gate.session.sub },
      });
      return res.status(200).json({ case: Array.isArray(cs) ? cs[0] : cs, patient });
    }
    return res.status(405).json({ error: "GET or POST" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
