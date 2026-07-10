import { claude, extractJSON } from "../lib/ai.js";

const SYSTEM = `You read Indian fertility lab/imaging reports. They are often messy: multiple labs, handwritten
notes, phone photos, vernacular text, non-standard units. Normalise everything to standard values.
Return ONLY JSON (no prose, no fences):
{
  "labs": [{ "name": "AMH", "value": "2.4", "unit": "ng/mL", "ref": "1-4", "flag": 0 }],
  "hsg": "tubal status text or null",
  "notes": "one short line"
}
flag = 1 if the value is abnormal or borderline, else 0. Only include values actually present in the report.
Look for: AMH, FSH, LH, estradiol, AFC, TSH, prolactin, semen concentration/motility/progressive motility/
morphology/volume/vitality, and HSG/tubal patency.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { imageBase64, mediaType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required (base64, no data: prefix)" });

    const mt = mediaType || "image/jpeg";
    // PDFs go in a document block; images in an image block.
    const fileBlock = mt.includes("pdf")
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
      : { type: "image", source: { type: "base64", media_type: mt, data: imageBase64 } };

    const content = [
      fileBlock,
      { type: "text", text: "Extract all fertility-relevant values from this report as normalised JSON, using the schema in the system prompt." },
    ];
    const text = await claude({ system: SYSTEM, messages: [{ role: "user", content }, { role: "assistant", content: "{" }], max_tokens: 1200 });
    const json = extractJSON("{" + text);
    if (!json) return res.status(200).json({ error: "Could not parse model output", raw: text });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
