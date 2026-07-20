import { loadSettings, type AdvisorSettings } from './settings';

// Prompt to generate inline image tags within the response
const INLINE_VIZ_SYSTEM_PROMPT = `You are a UX and Data Visualization expert. When responding, insert image visualization markers at strategic points within your text to make the response feel like a well-designed article, NOT a slide deck with all images at the end.

STRICT RULES:
1. Place [IMAGE:...] markers at the TOP of one section, MIDDLE of another, and BOTTOM of another. Never cluster them.
2. At least one image must appear before the halfway point of the response.
3. Images should illustrate the point in the preceding paragraph, not summarize everything at the end.
4. Markers must be on their own line, between paragraphs.
5. The image description should be detailed (what charts, layout, colors) in English.
6. Example article structure:

[IMAGE:Hero diagram of the overall AI solution concept, clean dark navy background with purple accents]

Paragraph introducing the concept...

Paragraph explaining the current problem...

[IMAGE:Before/after comparison chart showing manual workflow vs AI automated workflow, KPI cards, minimal icons]

Paragraph explaining the impact...

Paragraph about implementation steps...

[IMAGE:Workflow diagram with 4 steps, arrows, agent icons, dark theme]

Final paragraph and CTA...

FAILURE: If you put all images at the end, the response will be rejected.`;

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
