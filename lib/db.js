// Talks to Supabase via PostgREST using the SERVICE ROLE key (server only).
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function sb(path, { method = "GET", body, prefer } = {}) {
  if (!URL || !KEY) throw new Error("Supabase env not set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
      Prefer: prefer || "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!r.ok) throw new Error("Supabase " + r.status + ": " + text);
  return data;
}
