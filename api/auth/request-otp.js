import { normalizePhone } from "../../lib/auth.js";

// DEMO auth: no SMS is sent. The OTP is a fixed demo code (see verify-otp).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { phone } = req.body || {};
  const p = normalizePhone(phone);
  if (p.length < 10) return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
  return res.status(200).json({ ok: true, demo: true, message: "Demo mode — enter OTP 123456" });
}
