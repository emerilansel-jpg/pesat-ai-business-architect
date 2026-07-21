// Proxy is served from same domain via nginx reverse proxy at /api/
const PROXY_URL = '/api';
import { loadSettings } from './settings';

export async function sendMessage(
  messages: Array<{ role: string; content: string }>,
  options?: { signal?: AbortSignal }
) {
  const settings = loadSettings();
  const provider = settings.textProvider;
  const model = provider === 'openai' ? settings.openaiModel : settings.deepseekModel;

  const response = await fetch(`${PROXY_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, messages, temperature: 0.8 }),
    signal: options?.signal,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function sendTextOnlyMessage(systemPrompt: string, userPrompt: string) {
  const settings = loadSettings();
  const provider = settings.textProvider;
  const model = provider === 'openai' ? settings.openaiModel : settings.deepseekModel;

  const response = await fetch(`${PROXY_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider, model, temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function generateImage(prompt: string, n: number = 1) {
  const settings = loadSettings();
  const response = await fetch(`${PROXY_URL}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider: settings.imageProvider, n }),
  });
  if (!response.ok) throw new Error(`Image API error: ${response.status}`);
  const data = await response.json();
  return { imageUrls: data.imageUrls || [] };
}

export async function webSearch(query: string) {
  const settings = loadSettings();
  if (!settings.webSearchEnabled) return null;

  const response = await fetch(`${PROXY_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Search API error: ${response.status}`);
  return response.json();
}

// === TEST CONNECTION ===
export interface TestResult {
  ok: boolean;
  latency: number;
  error?: string;
}

export async function testConnection(type: 'openai' | 'deepseek' | 'tavily'): Promise<TestResult> {
  const settings = loadSettings();
  const start = performance.now();

  try {
    if (type === 'openai') {
      const response = await fetch(`${PROXY_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai',
          model: settings.openaiModel,
          messages: [{ role: 'user', content: 'Hi' }],
          temperature: 0.1,
        }),
      });
      const latency = Math.round(performance.now() - start);
      if (response.ok) return { ok: true, latency };
      const err = await response.text();
      return { ok: false, latency, error: `HTTP ${response.status}: ${err}` };
    }

    if (type === 'deepseek') {
      const response = await fetch(`${PROXY_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'deepseek',
          model: settings.deepseekModel,
          messages: [{ role: 'user', content: 'Hi' }],
          temperature: 0.1,
        }),
      });
      const latency = Math.round(performance.now() - start);
      if (response.ok) return { ok: true, latency };
      const err = await response.text();
      return { ok: false, latency, error: `HTTP ${response.status}: ${err}` };
    }

    if (type === 'tavily') {
      const response = await fetch(`${PROXY_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      const latency = Math.round(performance.now() - start);
      if (response.ok) return { ok: true, latency };
      const err = await response.text();
      return { ok: false, latency, error: `HTTP ${response.status}: ${err}` };
    }

    return { ok: false, latency: 0, error: 'Unknown type' };
  } catch (e: any) {
    return { ok: false, latency: Math.round(performance.now() - start), error: e.message };
  }
}
