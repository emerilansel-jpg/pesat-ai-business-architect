import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import * as configStore from './configStore.cjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const PORT = process.env.PORT || 3001;

app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Local proxy for OpenAI image generation.
 * The remote VPS proxy currently hardcodes dall-e-3, which is no longer
 * available for this account. This local proxy uses gpt-image-1 instead.
 */
app.post('/api/image', async (req: Request, res: Response) => {
  try {
    const { prompt, n = 1, model = 'gpt-image-1', size = '1024x1024' } = req.body;
    const apiKey = req.body.apiKey || configStore.getKey('openai');
    console.log('Image request received, key present:', !!apiKey, 'prompt:', prompt?.slice(0, 50));

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing OpenAI API key' });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
      }),
    });

    console.log('OpenAI response status:', response.status, 'content-type:', response.headers.get('content-type'));

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Image generation failed',
        raw: data,
      });
    }

    const imageUrls = data.data.map((item: any) => {
      if (item.b64_json) {
        return `data:image/png;base64,${item.b64_json}`;
      }
      return item.url;
    }).filter(Boolean);
    return res.json({ imageUrls });
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Local proxy for chat completions (OpenAI / DeepSeek).
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { provider, model, messages, temperature = 0.8 } = req.body;
    const apiKey = req.body.apiKey || configStore.getKey(provider);

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    const baseUrl =
      provider === 'deepseek'
        ? 'https://api.deepseek.com/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, stream: false }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Chat API failed',
        raw: data,
      });
    }

    return res.json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (err: any) {
    console.error('Chat proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Local proxy for Tavily web search.
 */
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const apiKey = req.body.apiKey || configStore.getKey('tavily');

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing Tavily API key' });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, search_depth: 'basic', max_results: 5 }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Search failed', raw: data });
    }

    return res.json(data);
  } catch (err: any) {
    console.error('Search proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Server-side config endpoints.
 */
app.get('/api/config', (_req: Request, res: Response) => {
  configStore.ensureConfig();
  const config = configStore.loadConfig();
  res.json({
    ...config,
    hasOpenAiKey: configStore.hasKey('openai'),
    hasDeepseekKey: configStore.hasKey('deepseek'),
    hasTavilyKey: configStore.hasKey('tavily'),
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const { adminPassword, config } = req.body;
  if (!configStore.verifyAdminPassword(adminPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  configStore.saveConfig(config);
  res.json({ success: true });
});

app.post('/api/keys', (req: Request, res: Response) => {
  const { adminPassword, keys } = req.body;
  if (!configStore.verifyAdminPassword(adminPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  configStore.saveKeys(keys);
  res.json({ success: true });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Local proxy server running on http://localhost:${PORT}`);
});
