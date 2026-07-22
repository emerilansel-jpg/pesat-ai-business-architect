import { loadSettings, type AdvisorSettings } from './settings';

// Prompt to generate inline image tags + visual formatting within the response.
// The goal: every answer should feel visual — a mix of image, table, emoji,
// and structured bullets — not a wall of text.
const INLINE_VIZ_SYSTEM_PROMPT = `You are a UX and Data Visualization expert. Every response MUST be visually rich and easy to scan. Mix these elements whenever they help (don't force ALL of them every time, but default to visual):

## VISUAL ELEMENTS YOU MUST USE (whenever relevant)

1. **Markdown tables** — Use them for comparisons, before/after, KPIs, pros/cons, competitor analysis, pricing tiers, timelines. Tables make data instantly readable.

Example:
| Channel | Status | Bottleneck |
|---------|--------|-----------|
| IG Ads | 🟢 jalan | Conversion lemah |
| Email | 🔴 mati | Tidak ada follow-up |

2. **[IMAGE:...] markers** — Inline diagrams, charts, workflow visuals. Place them at strategic points (top, middle, bottom), never cluster at the end. At least one image before the halfway point. Detailed English description of what to draw.

3. **Strategic emoji** — Use as visual anchors for sections and status, NOT decoration spam. 1 emoji per heading or list bullet max. Examples:
   - 🎯 untuk goal
   - 💰 untuk revenue
   - ⚠️ untuk masalah
   - ✅ untuk solusi
   - 📊 untuk data
   - 🤖 untuk AI/automation

4. **Bullet lists** — Break long paragraphs into bullets with bold key terms.

## FORMAT EXAMPLE (the kind of answer we want)

**Diagnosa awal** 🎯

Setelah baca pola bisnis JetDigitalPro, ini observasinya:

| Area | Temuan | Dampak |
|------|--------|--------|
| SEO content | Kuat | Tapi butuh skala |
| Sales follow-up | Manual | Leads bocor 40% |

[IMAGE:Funnel diagram showing where leads drop off between SEO traffic and paying customers, dark navy theme with purple accents]

Saya curiga ada hidden cost di sini... ⚠️

## STRICT RULES
- Default to visual. If a response has NO table, NO image, NO bullet, you failed.
- Tables for data/comparisons. Images for concepts/flows. Emoji as anchors. Bullets for lists.
- Conversational tone stays — visuals SUPPORT the chat, not replace the warmth.
- Place [IMAGE:...] markers on their own line between paragraphs.`;

// Generate image URL via Pollinations.ai (free, no API key)
function makePollinationsUrl(prompt: string, seed: number): string {
  const clean = prompt.replace(/\[|\]/g, '').substring(0, 900);
  const encoded = encodeURIComponent(clean);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
}

// Deterministic hash for consistent image URLs
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Build a deterministic Pollinations.ai URL from an image description */
export function getPollinationsUrl(description: string, index: number): string {
  const seed = hashString(description) + index * 1000;
  const clean = description.replace(/\[|\]/g, '').substring(0, 900);
  const encoded = encodeURIComponent(clean);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

export interface InlineImage {
  url: string;
  description: string;
}

/** Parse text for [IMAGE:...] tags and split into segments */
export function parseInlineImages(text: string): {
  segments: Array<{ type: 'text'; content: string } | { type: 'image'; description: string }>;
} {
  const regex = /\[IMAGE:([^\]]+)\]/g;
  const segments: Array<
    | { type: 'text'; content: string }
    | { type: 'image'; description: string }
  > = [];

  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Text before this image
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push({ type: 'text', content: before });
    }
    // Image marker
    segments.push({ type: 'image', description: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  // Remaining text
  const after = text.slice(lastIndex).trim();
  if (after) {
    segments.push({ type: 'text', content: after });
  }

  // If no images found, return the whole text as one segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }

  return { segments };
}

/** Generate image URLs for inline image descriptions */
export async function generateInlineImages(
  segments: Array<{ type: 'text' | 'image'; content?: string; description?: string }>
): Promise<Array<{ type: 'text' | 'image'; content?: string; url?: string; description?: string }>> {
  const settings = loadSettings();
  if (!settings.autoImageGen) {
    return segments.map((s) =>
      s.type === 'text'
        ? { type: 'text', content: s.content! }
        : { type: 'text', content: '' }
    );
  }

  const result: Array<{
    type: 'text' | 'image';
    content?: string;
    url?: string;
    description?: string;
  }> = [];

  let imageIndex = 0;
  for (const seg of segments) {
    if (seg.type === 'text') {
      result.push({ type: 'text', content: seg.content || '' });
    } else if (seg.type === 'image') {
      const enhancedPrompt = buildDallePrompt(seg.description || '', settings.imageStyle);
      const url = makePollinationsUrl(enhancedPrompt, Date.now() + imageIndex * 1000);
      result.push({ type: 'image', url, description: seg.description });
      imageIndex++;
    }
  }

  return result;
}

/** Get the system prompt extension for inline visualization */
export function getInlineVizPrompt(): string {
  const settings = loadSettings();
  if (!settings.autoImageGen) return '';
  return '\n\n' + INLINE_VIZ_SYSTEM_PROMPT;
}

export function buildDallePrompt(description: string, style: AdvisorSettings['imageStyle']): string {
  const styleNote =
    style === 'professional'
      ? 'Professional corporate style, clean lines, executive dashboard aesthetic, navy and purple gradients.'
      : style === 'creative'
      ? 'Creative modern style, bold shapes, artistic composition, vibrant purple and dark blue gradients.'
      : style === 'minimal'
      ? 'Ultra-minimal infographic, generous whitespace, subtle purple accents on dark background.'
      : 'Data-driven analytics style, prominent charts and graphs, dashboard aesthetic, KPI cards.';

  return `${description} ${styleNote} Dark navy (#0B0F1A) background with purple (#7C3AED) accents. Modern business aesthetic, high quality, clean, no text or letters.`;
}
