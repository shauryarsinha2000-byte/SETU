import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-change-me";

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlJSON(o) { return b64url(JSON.stringify(o)); }
function fromB64url(s) { return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(); }

export function signToken(payload, ttlSec = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: now, exp: now + ttlSec };
  const data = b64urlJSON(header) + "." + b64urlJSON(body);
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
  return data + "." + sig;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const data = parts[0] + "." + parts[1];
  const expected = b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
  // constant-time compare
  const a = Buffer.from(expected), b = Buffer.from(parts[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(fromB64url(parts[1]));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (_) { return null; }
}

export function getSession(req) {
  const h = req.headers["authorization"] || req.headers["Authorization"] || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? verifyToken(m[1]) : null;
}

export function requireRole(req, roles) {
  const s = getSession(req);
  if (!s) return { ok: false, code: 401, error: "Not authenticated" };
  if (roles && roles.length && !roles.includes(s.role)) return { ok: false, code: 403, error: "Not allowed for role " + s.role };
  return { ok: true, session: s };
}

export function normalizePhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
