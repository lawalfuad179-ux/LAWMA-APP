import { GoogleGenerativeAI } from '@google/generative-ai';

import { logger } from '@/lib/logger';

export type WasteItem = {
  name: string;
  recyclable: boolean;
  category: 'plastic' | 'paper' | 'glass' | 'metal' | 'organic' | 'ewaste' | 'non-recyclable';
  instruction: string;
};

export type RecycleAiReport = {
  items: WasteItem[];
  summary: string;
  recyclableCount: number;
  nonRecyclableCount: number;
  environmentalImpact: string;
  tips: string[];
  imageValid: boolean;
};

const SYSTEM_PROMPT = `You are a waste classification AI for LAWMA (Lagos Waste Management Authority), Nigeria.
Your job is to analyze photos of household or street waste and return structured JSON.

CRITICAL RULES — follow these without exception:
1. If the image is blank, black, dark, blurry, corrupted, or does not clearly show physical waste or trash items, you MUST return imageValid: false with an empty items array. Do NOT invent items.
2. If the image shows a scene with no waste (empty room, clear surface, person, landscape, text, solid color), return imageValid: false with empty items.
3. Only classify items you can clearly and unambiguously identify in the photo. Never guess or hallucinate.
4. Be specific to Lagos recycling infrastructure: PSP operators collect general waste, Wecyclers and similar NGOs handle recyclables (plastics, paper, metals, glass). Organic waste can be composted. E-waste should go to certified drop-off points.

Respond ONLY with valid JSON. No markdown fences, no explanation text.`;

const USER_PROMPT = `Look at this image carefully.

First, decide: does this image clearly show physical waste or trash items?
- If NO (blank, dark, blurry, no waste visible): return imageValid: false, empty items array.
- If YES: classify each visible waste item.

Return JSON with exactly this shape:
{
  "imageValid": true,
  "items": [
    {
      "name": "Item name",
      "recyclable": true,
      "category": "plastic|paper|glass|metal|organic|ewaste|non-recyclable",
      "instruction": "Specific action: rinse and take to Wecyclers / compost / place in black bag etc."
    }
  ],
  "summary": "One sentence overview of what is in the image",
  "recyclableCount": 3,
  "nonRecyclableCount": 2,
  "environmentalImpact": "Positive impact statement if these items are recycled correctly",
  "tips": ["Short actionable tip 1", "Short actionable tip 2"]
}

For a blank, dark, or non-waste image return exactly:
{
  "imageValid": false,
  "items": [],
  "summary": "No waste detected in this image.",
  "recyclableCount": 0,
  "nonRecyclableCount": 0,
  "environmentalImpact": "",
  "tips": []
}`;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeWasteImage(imageUrl: string): Promise<RecycleAiReport> {
  const modelName = process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';
  const genAI = getClient();

  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`Failed to fetch image for analysis: ${imgResp.status}`);

  let buffer = Buffer.from(await imgResp.arrayBuffer());
  const rawMime = (imgResp.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();

  let mime: string;
  if (rawMime === 'image/heic' || rawMime === 'image/heif') {
    const { default: heicConvert } = await import('heic-convert');
    const converted = await heicConvert({
      buffer: new Uint8Array(buffer),
      format: 'JPEG',
      quality: 0.85,
    });
    buffer = Buffer.from(converted);
    mime = 'image/jpeg';
  } else if (rawMime === 'image/jpeg' || rawMime === 'image/png' || rawMime === 'image/webp' || rawMime === 'image/gif') {
    mime = rawMime;
  } else {
    mime = 'image/jpeg';
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: mime, data: buffer.toString('base64') } },
          { text: USER_PROMPT },
        ],
      },
    ],
  });

  const response = result.response;
  const raw = response.text();

  if (!raw) {
    logger.error('ai.analyze_waste.empty_response', { model: modelName });
    throw new Error('AI returned an empty response. Please try again.');
  }

  if (response.promptFeedback?.blockReason) {
    logger.error('ai.analyze_waste.blocked', {
      blockReason: response.promptFeedback.blockReason,
      model: modelName,
    });
    throw new Error('AI response was blocked by safety filters. Please try a different image.');
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error('ai.analyze_waste.no_json', { raw: raw.slice(0, 200) });
    throw new Error('AI returned an unreadable response. Please try again.');
  }

  let parsed: RecycleAiReport;
  try {
    parsed = JSON.parse(jsonMatch[0]) as RecycleAiReport;
  } catch (parseErr) {
    logger.error('ai.analyze_waste.json_parse_failed', { raw: raw.slice(0, 300), error: String(parseErr) });
    throw new Error('AI response could not be read. Please try again.');
  }

  if (typeof parsed.imageValid !== 'boolean') {
    parsed.imageValid = parsed.items.length > 0;
  }

  logger.info('ai.analyze_waste.success', {
    model: modelName,
    imageValid: parsed.imageValid,
    itemCount: parsed.items.length,
  });

  return parsed;
}
