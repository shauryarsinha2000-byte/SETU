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

// Pull the first JSON object/array out of a model response (handles code fences).
export function extractJSON(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("{");
  const a = t.indexOf("[");
  let start = a >= 0 && (a < s || s < 0) ? a : s;
  if (start < 0) return null;
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  const end = t.lastIndexOf(close);
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (_) {
    try { return JSON.parse(t); } catch (__) { return null; }
  }
}
