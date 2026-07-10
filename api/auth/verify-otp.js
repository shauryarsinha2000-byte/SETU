import { normalizePhone, signToken } from "../../lib/auth.js";
import { sb } from "../../lib/db.js";

const DEMO_OTP = process.env.DEMO_OTP || "123456";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { phone, code } = req.body || {};
    const p = normalizePhone(phone);
    if (String(code) !== DEMO_OTP) return res.status(401).json({ error: "Invalid code. Demo OTP is 123456." });

    const rows = await sb(`profiles?phone=eq.${encodeURIComponent(p)}&active=eq.true&select=*`);
    if (!rows || !rows.length) {
      return res.status(403).json({ error: "No active staff account for this number. Ask an admin to invite you." });
    }
    const u = rows[0];
    const token = signToken({ sub: u.id, role: u.role, name: u.name, qualification: u.qualification, phone: u.phone });
    return res.status(200).json({
      token,
      profile: { id: u.id, name: u.name, role: u.role, qualification: u.qualification, phone: u.phone },
    });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
