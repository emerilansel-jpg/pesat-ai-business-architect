import { loadSettings } from './settings';

// Prompt to generate inline image tags within the response
const INLINE_VIZ_SYSTEM_PROMPT = `You are a UX and Data Visualization expert. When responding, insert image visualization markers at strategic points within your text to make the response more visual and easier to understand.

RULES:
- Insert [IMAGE:brief description of what to visualize] BETWEEN paragraphs where a visual would help understanding
- Place 1-3 image markers total, at natural breaking points in the text
- The image description should be detailed (what charts, layout, colors) in English
- Markers should be on their own line, between paragraphs
- Example:
  Paragraph about revenue...

  [IMAGE:Bar chart showing revenue growth from 10M to 50M over 5 years with purple gradient bars on dark navy background, clean minimalist business style]

  Paragraph about the analysis...

  DO NOT put all images at the end. Scatter them throughout the response.`;

// Generate image URL via Pollinations.ai (free, no API key)
function makePollinationsUrl(prompt: string, seed: number): string {
  const clean = prompt.replace(/\[|\]/g, '').substring(0, 900);
  const encoded = encodeURIComponent(clean);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
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

  const styleNote =
    settings.imageStyle === 'professional'
      ? 'Professional corporate style, clean lines, executive dashboard aesthetic, navy and purple gradients.'
      : settings.imageStyle === 'creative'
      ? 'Creative modern style, bold shapes, artistic composition, vibrant purple and dark blue gradients.'
      : settings.imageStyle === 'minimal'
      ? 'Ultra-minimal infographic, generous whitespace, subtle purple accents on dark background.'
      : 'Data-driven analytics style, prominent charts and graphs, dashboard aesthetic, KPI cards.';

  let imageIndex = 0;
  for (const seg of segments) {
    if (seg.type === 'text') {
      result.push({ type: 'text', content: seg.content || '' });
    } else if (seg.type === 'image') {
      const enhancedPrompt = `${seg.description} ${styleNote} Dark navy (#0B0F1A) background with purple (#7C3AED) accents. Modern business aesthetic, high quality, clean, no text or letters.`;
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
