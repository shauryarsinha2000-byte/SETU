// Sarvam AI: Indic speech-to-text with translation to English in one call (saaras model, translate mode).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const key = process.env.SARVAM_API_KEY;
    if (!key) return res.status(500).json({ error: "SARVAM_API_KEY is not set in the deployment environment." });

    const { audioBase64, mimeType } = req.body || {};
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 required (base64, no data: prefix)" });

    const buf = Buffer.from(audioBase64, "base64");
    const form = new FormData();
    form.append("file", new Blob([buf], { type: mimeType || "audio/webm" }), "audio.webm");
    form.append("model", "saaras:v3");
    // translate => output is English regardless of the spoken Indian language
    form.append("mode", "translate");

    const r = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": key },
      body: form,
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "Sarvam API " + r.status + ": " + t });
    }
    const data = await r.json();
    return res.status(200).json({
      english: data.transcript || data.translated_text || "",
      language: data.language_code || data.detected_language || "",
      raw: data,
    });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
