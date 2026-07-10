// Shared helpers for calling Claude. Keys come ONLY from server env — never the browser.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

export async function claude({ system, messages, max_tokens = 1400 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set in the deployment environment.");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens, system, messages }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error("Claude API " + r.status + ": " + t);
  }
  const data = await r.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// Pull the first complete JSON object/array out of a model response.
// Handles code fences, leading prose, and trailing commas.
export function extractJSON(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const s = t.indexOf("{");
  const a = t.indexOf("[");
  let start = a >= 0 && (a < s || s < 0) ? a : s;
  if (start < 0) return null;
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  // Balanced scan that respects strings/escapes so we grab exactly one JSON value.
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) { end = i; break; } }
  }
  const slice = end >= 0 ? t.slice(start, end + 1) : t.slice(start);
  const tryParse = (x) => { try { return JSON.parse(x); } catch (_) { return undefined; } };
  let r = tryParse(slice);
  if (r !== undefined) return r;
  r = tryParse(slice.replace(/,\s*([}\]])/g, "$1")); // strip trailing commas
  return r === undefined ? null : r;
}
