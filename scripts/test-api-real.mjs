import { loadSettings, DEFAULT_STEP_PROMPTS } from '../src/services/settings.ts';
import { getInlineVizPrompt } from '../src/services/visualization.ts';

const settings = loadSettings();
const step1Prompt = settings.stepPrompts?.[0]?.prompt || DEFAULT_STEP_PROMPTS[0].prompt;
const inlineVizPrompt = getInlineVizPrompt();
const choicePrompt = "\n\nCRITICAL: Every response MUST end with clickable multiple choice options using this exact format: [CHOICE:option 1|option 2|option 3]. Options must be concise (2-5 words each). Always include a 'Lainnya...' option as the last choice so the user can type freely.";
const systemPrompt = step1Prompt + (inlineVizPrompt || '') + choicePrompt;

const body = {
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: settings.openaiKey,
  temperature: 0.8,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'halo' }
  ]
};

const bodyString = JSON.stringify(body);
console.log('Body size:', Buffer.byteLength(bodyString), 'bytes');

const response = await fetch('https://apps.pesat.ai/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: bodyString
});

console.log('HTTP status:', response.status);
const text = await response.text();
console.log('Response:', text.slice(0, 500));
