import OpenAI from 'openai';

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
};

const SYSTEM_PROMPT = `You are a waste classification AI for LAWMA (Lagos Waste Management Authority), Nigeria.
Analyze images of household or street waste and return a structured JSON response.
Be specific to Lagos recycling infrastructure: PSP operators collect general waste,
Wecyclers and similar NGOs handle recyclables (plastics, paper, metals, glass).
Organic waste can be composted. E-waste should go to certified drop-off points.
Respond ONLY with valid JSON, no markdown or explanation.`;

const USER_PROMPT = `Analyze this image of waste/trash items.
Return JSON with exactly this shape:
{
  "items": [
    {
      "name": "Item name",
      "recyclable": true,
      "category": "plastic|paper|glass|metal|organic|ewaste|non-recyclable",
      "instruction": "Specific action: rinse and take to Wecyclers / compost / place in black bag etc."
    }
  ],
  "summary": "One sentence overview of what's in the image",
  "recyclableCount": 3,
  "nonRecyclableCount": 2,
  "environmentalImpact": "Positive impact statement if these items are recycled correctly",
  "tips": ["Short actionable tip 1", "Short actionable tip 2"]
}`;

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  });
}

export async function analyzeWasteImage(imageUrl: string): Promise<RecycleAiReport> {
  const client = getClient();
  const model = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-pro';

  const imgResp = await fetch(imageUrl);
  const buffer = Buffer.from(await imgResp.arrayBuffer());
  const mime = imgResp.headers.get('content-type') || 'image/jpeg';
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;

  const response = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[image](${dataUri})\n\n${USER_PROMPT}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';
  const cleaned = raw.replace(/```json\n?|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as RecycleAiReport;
  } catch {
    throw new Error('AI returned invalid JSON. Try again or use a different image.');
  }
}
