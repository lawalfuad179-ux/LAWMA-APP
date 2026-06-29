import Anthropic from '@anthropic-ai/sdk';

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

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }
  return new Anthropic({ apiKey });
}

export async function analyzeWasteImage(imageUrl: string): Promise<RecycleAiReport> {
  const model = process.env.CLAUDE_VISION_MODEL || 'claude-haiku-4-5-20251001';
  const client = getClient();

  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`Failed to fetch image for analysis: ${imgResp.status}`);

  let buffer = Buffer.from(await imgResp.arrayBuffer());
  const rawMime = (imgResp.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();

  // Anthropic vision only accepts jpeg/png/webp/gif. iPhone uploads are HEIC/HEIF —
  // convert to JPEG before sending, otherwise the API rejects them.
  let mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
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

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mime,
              data: buffer.toString('base64'),
            },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Guard against truncated responses (stop_reason === 'max_tokens' mid-JSON)
  if (response.stop_reason === 'max_tokens') {
    logger.error('ai.analyze_waste.truncated', { rawLength: raw.length, model });
    throw new Error('The AI response was too long to process. Please try with a simpler image.');
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

  // Normalise imageValid in case the model omitted it
  if (typeof parsed.imageValid !== 'boolean') {
    parsed.imageValid = parsed.items.length > 0;
  }

  logger.info('ai.analyze_waste.success', {
    model,
    imageValid: parsed.imageValid,
    itemCount: parsed.items.length,
  });

  return parsed;
}
