import { requireRole } from "../../../lib/auth.js";
import { sb } from "../../../lib/db.js";

// POST /api/cases/:id/conversation
// body: { transcript, findings, mergeNote, history, demographics }
// - stores transcript/findings/mergeNote in evidence.conversation
// - merges history into evidence.history
// - fills BLANK patient demographic columns only (never overwrites what reception entered)
export default async function handler(req, res) {
  const gate = requireRole(req, ["gp", "admin", "specialist"]);
  if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const id = req.query.id;
  try {
    const rows = await sb("cases?id=eq." + id + "&select=evidence,patient_id");
    const c = rows && rows[0];
    if (!c) return res.status(404).json({ error: "case not found" });

    const b = req.body || {};
    const ev = c.evidence || {};
    const conversation = { ...(ev.conversation || {}) };
    if (b.transcript != null) conversation.transcript = b.transcript;
    if (b.findings) conversation.findings = b.findings;
    if (b.mergeNote != null) conversation.mergeNote = b.mergeNote;
    const history = { ...(ev.history || {}), ...(b.history || {}) };
    await sb("cases?id=eq." + id, { method: "PATCH", body: { evidence: { ...ev, conversation, history } } });

    // auto-fill blank patient demographics only
    const filled = [];
    const dem = b.demographics || {};
    if (c.patient_id && Object.keys(dem).length) {
      const prow = await sb("patients?id=eq." + c.patient_id + "&select=*");
      const pt = prow && prow[0];
      if (pt) {
        const map = { age: "age", partnerAge: "partner_age", bmi: "bmi", location: "location", married: "married" };
        const upd = {};
        Object.keys(map).forEach(function (k) {
          const col = map[k];
          const blank = pt[col] === null || pt[col] === undefined || pt[col] === "";
          const val = dem[k];
          if (blank && val != null && String(val).trim() !== "") {
            if (col === "age" || col === "partner_age") {
              const n = parseInt(String(val).replace(/\D/g, ""), 10);
              if (!isNaN(n)) { upd[col] = n; filled.push(col); }
            } else { upd[col] = val; filled.push(col); }
          }
        });
        if (Object.keys(upd).length) await sb("patients?id=eq." + c.patient_id, { method: "PATCH", body: upd });
      }
    }
    return res.status(200).json({ ok: true, filled });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
