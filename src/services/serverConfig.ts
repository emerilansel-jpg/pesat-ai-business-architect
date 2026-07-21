import type { AdvisorSettings } from './settings';

export interface ServerConfig extends Omit<AdvisorSettings, 'openaiKey' | 'deepseekKey' | 'tavilyKey'> {
  updatedAt: string;
  hasOpenAiKey: boolean;
  hasDeepseekKey: boolean;
  hasTavilyKey: boolean;
}

export async function fetchServerConfig(): Promise<ServerConfig | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch server config:', e);
    return null;
  }
}
