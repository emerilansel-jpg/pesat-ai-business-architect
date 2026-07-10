export interface StepPrompt {
  step: number;
  name: string;
  prompt: string;
  costPer1K: string;
}

export interface AdvisorSettings {
  textProvider: 'openai' | 'deepseek';
  imageProvider: 'openai-image';
  openaiModel: string;
  deepseekModel: string;
  openaiKey: string;
  deepseekKey: string;
  tavilyKey: string;
  autoImageGen: boolean;
  imageStyle: 'professional' | 'creative' | 'minimal' | 'data-driven';
  maxImagesPerResponse: 1 | 2;
  webSearchEnabled: boolean;
  stepPrompts: StepPrompt[];
}

// 6 steps (greeting removed — chat starts directly)
export const DEFAULT_STEP_PROMPTS: StepPrompt[] = [
  {
    step: 1,
    name: 'Deep Research & Analysis',
    prompt:
      'Based on the business info provided, conduct a deep analysis. Identify: 1) The most expensive problem they face, 2) Why AI is the right solution, 3) Estimated ROI. Use business frameworks. Include [IMAGE:...] tags for visualizations. End with [CHOICE:option1|option2|option3]. Be thorough and data-driven.',
    costPer1K: '$0.03',
  },
  {
    step: 2,
    name: 'Interview (3 Questions)',
    prompt:
      'Ask 3 strategic interview questions one at a time to deeply understand the business pain points. Each question should build on previous answers. Use [CHOICE:...] for multiple choice. Goal: uncover the true cost of their problems.',
    costPer1K: '$0.03 x 3',
  },
  {
    step: 3,
    name: 'Summary & Confirm',
    prompt:
      'Summarize all findings from the interview. Present: business profile, key problems identified, recommended AI solutions, and expected impact. Ask for confirmation before generating the WOW report. End with [CHOICE:option1|option2|option3].',
    costPer1K: '$0.03',
  },
  {
    step: 4,
    name: 'WOW Report',
    prompt:
      'Generate a comprehensive WOW report. Include: executive summary, problem analysis, AI solution blueprint, implementation roadmap, ROI projection, and success metrics. Use [IMAGE:...] tags for charts and diagrams. End with [CHOICE:option1|option2|option3]. Make it visually stunning.',
    costPer1K: '$0.03 - $0.06',
  },
  {
    step: 5,
    name: 'Pricing & CTA',
    prompt:
      'Present pricing: starting from ~$300 (like hiring 1 UMR staff). Explain performance-based model. End with strong CTA. Use [CHOICE:Ya, saya tertarik|Saya perlu pikir dulu|Belum].',
    costPer1K: '$0.03',
  },
  {
    step: 6,
    name: 'Qualify + WA Link',
    prompt:
      'Qualify the lead: ask urgency 1-10, employee count, yearly revenue. Then provide WA link https://wa.me/6281290401240. Close professionally.',
    costPer1K: '$0.03',
  },
];

export const DEFAULT_SETTINGS: AdvisorSettings = {
  textProvider: 'openai',
  imageProvider: 'openai-image',
  openaiModel: 'gpt-4o',
  deepseekModel: 'deepseek-chat',
  openaiKey: 'YOUR_OPENAI_API_KEY',
  deepseekKey: '',
  tavilyKey: '',
  autoImageGen: true,
  imageStyle: 'professional',
  maxImagesPerResponse: 1,
  webSearchEnabled: true,
  stepPrompts: [...DEFAULT_STEP_PROMPTS],
};

export function loadSettings(): AdvisorSettings {
  try {
    const saved = localStorage.getItem('advisor_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset stepPrompts if count doesn't match (schema changed)
      if (!parsed.stepPrompts || parsed.stepPrompts.length !== 6) {
        parsed.stepPrompts = [...DEFAULT_STEP_PROMPTS];
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: AdvisorSettings) {
  localStorage.setItem('advisor_settings', JSON.stringify(s));
}
