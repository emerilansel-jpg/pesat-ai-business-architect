const http = require('http');
const dns = require('dns');

// Prefer IPv4 to avoid connect timeouts when IPv6 resolution fails.
dns.setDefaultResultOrder('ipv4first');

const MAX_BODY_BYTES = 20 * 1024 * 1024; // 20 MB safety limit

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  let body = '';
  let bodySize = 0;
  let rejected = false;

  req.on('data', chunk => {
    if (rejected) return;
    bodySize += chunk.length;
    if (bodySize > MAX_BODY_BYTES) {
      rejected = true;
      console.error(`[${new Date().toISOString()}] Body too large: ${bodySize} bytes`);
      res.writeHead(413, CORS);
      res.end(JSON.stringify({ error: 'Request body too large' }));
      return;
    }
    body += chunk;
  });

  req.on('end', async () => {
    if (rejected) return;

    try {
      const path = req.url;
      console.log(`[${new Date().toISOString()}] ${req.method} ${path} body=${bodySize} bytes`);

      if (path === '/health') {
        res.writeHead(200, CORS);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (path === '/chat') {
        const data = JSON.parse(body);
        const provider = data.provider || 'openai';
        const apiUrl = provider === 'deepseek'
          ? 'https://api.deepseek.com/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const apiKey = provider === 'deepseek'
          ? (data.apiKey || DEEPSEEK_API_KEY)
          : (data.apiKey || OPENAI_API_KEY);

        if (!apiKey) {
          res.writeHead(400, CORS);
          res.end(JSON.stringify({ error: 'Missing API key' }));
          return;
        }

        const payload = {
          model: data.model || 'gpt-4o',
          messages: data.messages,
          temperature: data.temperature || 0.8,
          max_tokens: 2000,
        };

        console.log(`[chat] provider=${provider} model=${payload.model} messages=${payload.messages.length} totalBody=${bodySize}`);

        const response = await fetchWithTimeout(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error(`[chat] API error ${response.status}:`, result);
          res.writeHead(response.status, CORS);
          res.end(JSON.stringify({ error: 'Chat API failed', raw: result }));
          return;
        }
        if (result.choices && result.choices[0]) {
          const content = result.choices[0].message?.content || '';
          console.log(`[chat] OK contentLength=${content.length}`);
          res.writeHead(200, CORS);
          res.end(JSON.stringify({ content }));
        } else {
          console.error('[chat] Invalid response:', result);
          res.writeHead(200, CORS);
          res.end(JSON.stringify({ error: 'Invalid response', raw: result }));
        }
        return;
      }

      if (path === '/image') {
        const data = JSON.parse(body);
        const apiKey = data.apiKey || OPENAI_API_KEY;

        if (!apiKey) {
          res.writeHead(400, CORS);
          res.end(JSON.stringify({ error: 'Missing API key' }));
          return;
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: (data.prompt || '').substring(0, 4000),
            n: Math.min(data.n || 1, 2),
            size: '1024x1024',
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error(`[image] API error ${response.status}:`, result);
          res.writeHead(response.status, CORS);
          res.end(JSON.stringify({ error: 'Image generation failed', raw: result }));
          return;
        }
        if (result.data) {
          console.log(`[image] OK images=${result.data.length}`);
          res.writeHead(200, CORS);
          res.end(JSON.stringify({
            imageUrls: result.data.map(img => img.b64_json ? 'data:image/png;base64,' + img.b64_json : img.url).filter(Boolean)
          }));
        } else {
          console.error('[image] Invalid response:', result);
          res.writeHead(500, CORS);
          res.end(JSON.stringify({ error: 'Image generation failed', raw: result }));
        }
        return;
      }

      if (path === '/search') {
        const data = JSON.parse(body);
        const apiKey = data.apiKey || TAVILY_API_KEY;
        if (!apiKey) {
          res.writeHead(400, CORS);
          res.end(JSON.stringify({ error: 'Missing Tavily API key' }));
          return;
        }
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: data.query,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 8,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error(`[search] API error ${response.status}:`, result);
          res.writeHead(response.status, CORS);
          res.end(JSON.stringify({ error: 'Search failed', raw: result }));
          return;
        }
        res.writeHead(200, CORS);
        res.end(JSON.stringify({ answer: result.answer, results: result.results }));
        return;
      }

      res.writeHead(404, CORS);
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (e) {
      console.error('Proxy error:', e);
      res.writeHead(500, CORS);
      res.end(JSON.stringify({ error: e.message }));
    }
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
    res.writeHead(500, CORS);
    res.end(JSON.stringify({ error: e.message }));
  });
});

server.listen(3002, '0.0.0.0', () => {
  console.log('Proxy v7 running on port 3002');
});
