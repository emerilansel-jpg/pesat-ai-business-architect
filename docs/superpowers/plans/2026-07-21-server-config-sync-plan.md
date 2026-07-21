# Server Config & API Key Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all non-sensitive settings to a server-side config file and keep all API keys on the server, so desktop and mobile stay in sync without sending keys to the browser.

**Architecture:** A shared plain-JS helper (`server/configStore.js`) reads/writes `advisor-config.json` and `advisor-keys.json`. Both the local dev server (`server/index.ts`) and production proxy (`scripts/advisor-proxy.js`) expose `/api/config` and `/api/keys` endpoints. The React app fetches the config on startup and the admin page pushes/pulls config and keys. The default provider becomes `deepseek`.

**Tech Stack:** Node.js (production proxy), `tsx` (local dev server), Express, React 19 + TypeScript, Vite, PM2.

---

## File Map

| File | Responsibility |
|------|---------------|
| `server/configStore.js` | Shared helper: atomic read/write of config and keys files, plus key lookup (`hasKey` / `getKey`). |
| `server/index.ts` | Local dev server: adds `GET/POST /api/config` and `POST /api/keys`. |
| `scripts/advisor-proxy.js` | Production proxy: adds `GET/POST /config` and `POST /keys` (Caddy strips `/api` prefix). |
| `src/services/serverConfig.ts` | Client helper to fetch `/api/config`. |
| `src/services/settings.ts` | Change default provider to `deepseek`; keep interface but keys are no longer meaningful locally. |
| `src/App.tsx` | Fetch server config on startup and merge into local settings if newer. |
| `src/services/ai.ts` | Stop sending API keys in request bodies; let server fallback handle keys. |
| `src/pages/Admin.tsx` | Add Save/Load buttons for server config and an API key save form. |
| `scripts/deploy-advisor.mjs` | Upload `configStore.js` alongside `advisor-proxy.js` and rewrite the require path. |

---

## Task 1: Create `server/configStore.js` with atomic read/write and key helpers

**Files:**
- Create: `server/configStore.js`
- Test: `scripts/test-configStore.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-configStore.mjs`:

```js
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const testDir = path.join(projectRoot, '.tmp-test-config');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

const require = createRequire(import.meta.url);
const configStore = require(path.join(projectRoot, 'server', 'configStore.js'));

const cfg = configStore.loadConfig();
console.assert(cfg.textProvider === 'deepseek', 'default provider should be deepseek');
console.assert(cfg.imageProvider === 'openai-image', 'default imageProvider');

configStore.saveConfig({ textProvider: 'openai', openaiModel: 'gpt-5' });
const loaded = configStore.loadConfig();
console.assert(loaded.textProvider === 'openai', 'config should persist textProvider');
console.assert(loaded.openaiModel === 'gpt-5', 'config should persist model');

configStore.saveKeys({ OPENAI_API_KEY: 'test-openai', DEEPSEEK_API_KEY: 'test-deepseek' });
console.assert(configStore.hasKey('openai'), 'openai key should exist');
console.assert(configStore.hasKey('deepseek'), 'deepseek key should exist');
console.assert(configStore.getKey('openai') === 'test-openai', 'getKey should return openai key');

configStore.saveKeys({ OPENAI_API_KEY: '', TAVILY_API_KEY: 'test-tavily' });
console.assert(configStore.getKey('openai') === 'test-openai', 'empty string should not erase key');
console.assert(configStore.getKey('tavily') === 'test-tavily', 'new key should be saved');

fs.rmSync(testDir, { recursive: true, force: true });
console.log('✅ configStore tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node scripts/test-configStore.mjs
```

Expected: `Error: Cannot find module ... server/configStore.js`

- [ ] **Step 3: Implement `server/configStore.js`**

```js
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.ADVISOR_DATA_DIR || (fs.existsSync('/var/www') ? '/var/www' : '.');
const CONFIG_PATH = path.join(DATA_DIR, 'advisor-config.json');
const KEYS_PATH = path.join(DATA_DIR, 'advisor-keys.json');

const DEFAULT_CONFIG = {
  textProvider: 'deepseek',
  imageProvider: 'openai-image',
  openaiModel: 'gpt-4o',
  deepseekModel: 'deepseek-chat',
  autoImageGen: true,
  imageStyle: 'professional',
  maxImagesPerResponse: 1,
  webSearchEnabled: true,
  stepPrompts: [],
  promptVersion: 4,
  updatedAt: new Date().toISOString(),
};

function atomicWrite(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function ensureConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
    }
  } catch (e) {
    console.error('Failed to ensure config:', e);
  }
}

function saveConfig(config) {
  const next = { ...config, updatedAt: new Date().toISOString() };
  delete next.openaiKey;
  delete next.deepseekKey;
  delete next.tavilyKey;
  delete next.hasOpenAiKey;
  delete next.hasDeepseekKey;
  delete next.hasTavilyKey;
  atomicWrite(CONFIG_PATH, next);
  return next;
}

function loadKeys() {
  try {
    if (fs.existsSync(KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load keys:', e);
  }
  return {};
}

function saveKeys(keys) {
  const existing = loadKeys();
  const next = { ...existing };
  for (const [k, v] of Object.entries(keys)) {
    if (v && typeof v === 'string') {
      next[k] = v;
    }
  }
  atomicWrite(KEYS_PATH, next);
  return next;
}

function keyNameFor(provider) {
  if (provider === 'deepseek') return 'DEEPSEEK_API_KEY';
  if (provider === 'tavily') return 'TAVILY_API_KEY';
  return 'OPENAI_API_KEY';
}

function hasKey(provider) {
  const keys = loadKeys();
  const name = keyNameFor(provider);
  return !!(keys[name] || process.env[name]);
}

function getKey(provider) {
  const keys = loadKeys();
  const name = keyNameFor(provider);
  return keys[name] || process.env[name];
}

function verifyAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'jdp123';
  return password === expected;
}

module.exports = {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  ensureConfig,
  loadKeys,
  saveKeys,
  hasKey,
  getKey,
  verifyAdminPassword,
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node scripts/test-configStore.mjs
```

Expected: `✅ configStore tests passed`

- [ ] **Step 5: Commit**

```bash
git add server/configStore.js scripts/test-configStore.mjs
git commit -m "feat: add server config and key store helper"
```

---

## Task 2: Add config/key endpoints to the local dev server

**Files:**
- Modify: `server/index.ts`
- Test: `scripts/test-api-config-local.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-api-config-local.mjs`:

```js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const testDir = path.join(projectRoot, '.tmp-test-api');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

const server = spawn('npx', ['tsx', 'server/index.ts'], { cwd: projectRoot, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 3000));

try {
  const res = await fetch('http://localhost:3001/api/config');
  console.assert(res.status === 200, 'GET /api/config should return 200');
  const body = await res.json();
  console.assert(body.textProvider === 'deepseek', 'default provider should be deepseek');
  console.assert(typeof body.hasOpenAiKey === 'boolean', 'hasOpenAiKey flag missing');
  console.assert(typeof body.hasDeepseekKey === 'boolean', 'hasDeepseekKey flag missing');

  const post = await fetch('http://localhost:3001/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', config: { textProvider: 'openai' } })
  });
  console.assert(post.status === 200, 'POST /api/config should succeed');

  const res2 = await fetch('http://localhost:3001/api/config');
  const body2 = await res2.json();
  console.assert(body2.textProvider === 'openai', 'config update should persist');

  const postBad = await fetch('http://localhost:3001/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'wrong', config: { textProvider: 'deepseek' } })
  });
  console.assert(postBad.status === 401, 'wrong password should 401');

  const keysPost = await fetch('http://localhost:3001/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', keys: { OPENAI_API_KEY: 'test-key' } })
  });
  console.assert(keysPost.status === 200, 'POST /api/keys should succeed');

  const res3 = await fetch('http://localhost:3001/api/config');
  const body3 = await res3.json();
  console.assert(body3.hasOpenAiKey === true, 'hasOpenAiKey should be true after saving key');
} finally {
  server.kill();
  fs.rmSync(testDir, { recursive: true, force: true });
}
console.log('✅ API config endpoints tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node scripts/test-api-config-local.mjs
```

Expected: `404` or connection error because the endpoints do not exist.

- [ ] **Step 3: Implement the endpoints in `server/index.ts`**

At the top of `server/index.ts`, add:

```ts
const configStore = require('./configStore.js');
```

Before `app.listen(...)`, add:

```ts
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
```

Also update the existing `/api/chat`, `/api/image`, and `/api/search` endpoints to use the server-side keys. For example, in `/api/chat`:

```ts
const apiKey = data.apiKey || configStore.getKey(provider);
```

Do the same for `/api/image` (uses `openai`) and `/api/search` (uses `tavily`).

- [ ] **Step 4: Run the test to verify it passes**

```bash
node scripts/test-api-config-local.mjs
```

Expected: `✅ API config endpoints tests passed`

- [ ] **Step 5: Commit**

```bash
git add server/index.ts scripts/test-api-config-local.mjs
git commit -m "feat: add server config and key endpoints to local dev server"
```

---

## Task 3: Add config/key endpoints to the production proxy

**Files:**
- Modify: `scripts/advisor-proxy.js`
- Test: `scripts/test-proxy-config.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-proxy-config.mjs`:

```js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const testDir = path.join(projectRoot, '.tmp-test-proxy');
fs.mkdirSync(testDir, { recursive: true });
process.env.ADVISOR_DATA_DIR = testDir;

const proxy = spawn('node', ['scripts/advisor-proxy.js'], { cwd: projectRoot, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2000));

try {
  const res = await fetch('http://localhost:3002/config');
  console.assert(res.status === 200, 'GET /config should return 200');
  const body = await res.json();
  console.assert(body.textProvider === 'deepseek', 'default provider should be deepseek');
  console.assert(typeof body.hasOpenAiKey === 'boolean', 'hasOpenAiKey flag missing');

  const post = await fetch('http://localhost:3002/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', config: { textProvider: 'openai' } })
  });
  console.assert(post.status === 200, 'POST /config should succeed');

  const res2 = await fetch('http://localhost:3002/config');
  const body2 = await res2.json();
  console.assert(body2.textProvider === 'openai', 'config update should persist');

  const keysPost = await fetch('http://localhost:3002/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: 'jdp123', keys: { DEEPSEEK_API_KEY: 'test' } })
  });
  console.assert(keysPost.status === 200, 'POST /keys should succeed');
} finally {
  proxy.kill();
  fs.rmSync(testDir, { recursive: true, force: true });
}
console.log('✅ proxy config endpoints tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node scripts/test-proxy-config.mjs
```

Expected: `404` or connection error because the endpoints do not exist.

- [ ] **Step 3: Implement the endpoints in `scripts/advisor-proxy.js`**

At the top of `scripts/advisor-proxy.js`, add:

```js
const configStore = require('../server/configStore.js');
```

Add `config` and `keys` route handlers inside the existing `req.on('end', ...)` block. Insert them before the existing `/chat` block (after `/health`):

```js
if (path === '/config') {
  if (req.method === 'GET') {
    configStore.ensureConfig();
    const config = configStore.loadConfig();
    res.writeHead(200, CORS);
    res.end(JSON.stringify({
      ...config,
      hasOpenAiKey: configStore.hasKey('openai'),
      hasDeepseekKey: configStore.hasKey('deepseek'),
      hasTavilyKey: configStore.hasKey('tavily'),
    }));
    return;
  }
  if (req.method === 'POST') {
    const data = JSON.parse(body);
    if (!configStore.verifyAdminPassword(data.adminPassword)) {
      res.writeHead(401, CORS);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    configStore.saveConfig(data.config);
    res.writeHead(200, CORS);
    res.end(JSON.stringify({ success: true }));
    return;
  }
}

if (path === '/keys') {
  if (req.method === 'POST') {
    const data = JSON.parse(body);
    if (!configStore.verifyAdminPassword(data.adminPassword)) {
      res.writeHead(401, CORS);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    configStore.saveKeys(data.keys);
    res.writeHead(200, CORS);
    res.end(JSON.stringify({ success: true }));
    return;
  }
}
```

Update the existing `/chat`, `/image`, and `/search` fallback logic to use the server-side keys. For example:

```js
const apiKey = data.apiKey || configStore.getKey(provider);
```

For `/image` use `configStore.getKey('openai')`. For `/search` use `configStore.getKey('tavily')`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node scripts/test-proxy-config.mjs
```

Expected: `✅ proxy config endpoints tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/advisor-proxy.js scripts/test-proxy-config.mjs
git commit -m "feat: add server config and key endpoints to production proxy"
```

---

## Task 4: Create client helper to fetch server config

**Files:**
- Create: `src/services/serverConfig.ts`

- [ ] **Step 1: Implement `src/services/serverConfig.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/services/serverConfig.ts
git commit -m "feat: add client helper to fetch server config"
```

---

## Task 5: Update default provider to DeepSeek in settings

**Files:**
- Modify: `src/services/settings.ts`

- [ ] **Step 1: Update `DEFAULT_SETTINGS`**

```ts
export const DEFAULT_SETTINGS: AdvisorSettings = {
  textProvider: 'deepseek',
  imageProvider: 'openai-image',
  openaiModel: 'gpt-4o',
  deepseekModel: 'deepseek-chat',
  openaiKey: '',
  deepseekKey: '',
  tavilyKey: '',
  autoImageGen: true,
  imageStyle: 'professional',
  maxImagesPerResponse: 1,
  webSearchEnabled: true,
  stepPrompts: [...DEFAULT_STEP_PROMPTS],
  promptVersion: 4,
};
```

- [ ] **Step 2: Add optional `updatedAt` to the interface**

```ts
export interface AdvisorSettings {
  ...
  updatedAt?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/settings.ts
git commit -m "chore: default text provider to deepseek and add optional updatedAt"
```

---

## Task 6: Fetch server config on app startup

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add an effect that fetches and merges server config**

Inside `ChatInterface`, after the activity hooks and refs, add:

```tsx
useEffect(() => {
  fetchServerConfig().then((serverConfig) => {
    if (!serverConfig) return;
    const localSettings = loadSettings();
    const serverUpdated = new Date(serverConfig.updatedAt).getTime();
    const localUpdated = localSettings.updatedAt ? new Date(localSettings.updatedAt).getTime() : 0;
    if (serverUpdated <= localUpdated) return;

    const next: AdvisorSettings = {
      ...localSettings,
      textProvider: serverConfig.textProvider,
      imageProvider: serverConfig.imageProvider,
      openaiModel: serverConfig.openaiModel,
      deepseekModel: serverConfig.deepseekModel,
      autoImageGen: serverConfig.autoImageGen,
      imageStyle: serverConfig.imageStyle,
      maxImagesPerResponse: serverConfig.maxImagesPerResponse,
      webSearchEnabled: serverConfig.webSearchEnabled,
      stepPrompts: serverConfig.stepPrompts.length ? serverConfig.stepPrompts : localSettings.stepPrompts,
      promptVersion: serverConfig.promptVersion,
      updatedAt: serverConfig.updatedAt,
    };
    saveSettings(next);
  });
}, []);
```

Also add the import at the top:

```tsx
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './services/settings';
import { fetchServerConfig } from './services/serverConfig';
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: fetch and merge server config on app startup"
```

---

## Task 7: Stop sending API keys from the client

**Files:**
- Modify: `src/services/ai.ts`

- [ ] **Step 1: Remove API keys from request bodies**

For `sendMessage`, change the body to:

```ts
body: JSON.stringify({ provider, model, messages, temperature: 0.8 }),
```

For `sendTextOnlyMessage`, change the body to:

```ts
body: JSON.stringify({ provider, model, messages, temperature: 0.8 }),
```

For `generateImage`, change the body to:

```ts
body: JSON.stringify({ prompt, provider: settings.imageProvider, n }),
```

For `webSearch`, change the body to:

```ts
body: JSON.stringify({ query }),
```

For `testConnection`, remove the `apiKey` from the body for each provider. For example:

```ts
body: JSON.stringify({ provider: 'openai', model: settings.openaiModel, messages: [{ role: 'user', content: 'Hi' }], temperature: 0.1 }),
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai.ts
git commit -m "feat: let server manage API keys, remove keys from client requests"
```

---

## Task 8: Update admin page to save/load server config and keys

**Files:**
- Modify: `src/pages/Admin.tsx`

- [ ] **Step 1: Add server config/key state and helpers**

Add imports:

```tsx
import { fetchServerConfig } from '../services/serverConfig';
```

Add state after the existing settings state:

```tsx
const [serverKeyStatus, setServerKeyStatus] = useState({
  openai: false,
  deepseek: false,
  tavily: false,
});
const [serverError, setServerError] = useState<string | null>(null);
```

Add a function to load server config into the admin page and persist it locally:

```tsx
const loadServerSettings = useCallback(async () => {
  try {
    const cfg = await fetchServerConfig();
    if (!cfg) return;
    const next: AdvisorSettings = {
      ...settings,
      textProvider: cfg.textProvider,
      imageProvider: cfg.imageProvider,
      openaiModel: cfg.openaiModel,
      deepseekModel: cfg.deepseekModel,
      autoImageGen: cfg.autoImageGen,
      imageStyle: cfg.imageStyle,
      maxImagesPerResponse: cfg.maxImagesPerResponse,
      webSearchEnabled: cfg.webSearchEnabled,
      stepPrompts: cfg.stepPrompts.length ? cfg.stepPrompts : settings.stepPrompts,
      promptVersion: cfg.promptVersion,
      updatedAt: cfg.updatedAt,
    };
    setSettings(next);
    saveSettings(next);
    setServerKeyStatus({
      openai: cfg.hasOpenAiKey,
      deepseek: cfg.hasDeepseekKey,
      tavily: cfg.hasTavilyKey,
    });
    setServerError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  } catch (e: any) {
    setServerError(e.message || 'Failed to load server config');
  }
}, [settings]);
```

Add a function to save non-key config to the server:

```tsx
const saveServerConfig = useCallback(async () => {
  try {
    const { openaiKey, deepseekKey, tavilyKey, ...config } = settings;
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: ADMIN_PASSWORD, config }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setServerError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  } catch (e: any) {
    setServerError(e.message || 'Failed to save server config');
  }
}, [settings]);
```

Add a function to save API keys to the server:

```tsx
const saveServerKeys = useCallback(async () => {
  try {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminPassword: ADMIN_PASSWORD,
        keys: {
          OPENAI_API_KEY: settings.openaiKey,
          DEEPSEEK_API_KEY: settings.deepseekKey,
          TAVILY_API_KEY: settings.tavilyKey,
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setServerKeyStatus({
      openai: !!settings.openaiKey,
      deepseek: !!settings.deepseekKey,
      tavily: !!settings.tavilyKey,
    });
    setServerError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  } catch (e: any) {
    setServerError(e.message || 'Failed to save API keys');
  }
}, [settings]);
```

Add a `useEffect` to fetch server config once after authentication:

```tsx
useEffect(() => {
  if (authenticated) {
    loadServerSettings();
  }
}, [authenticated, loadServerSettings]);
```

- [ ] **Step 2: Add UI buttons and status indicators**

Inside the admin panel, add near the “Saved” indicator or at the top of the settings sections:

```tsx
{serverError && (
  <p className="text-xs text-red-400 text-center">{serverError}</p>
)}

<div className="flex flex-wrap gap-2 justify-center">
  <button
    onClick={saveServerConfig}
    className="px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(124,58,237,0.2)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.1)]"
  >
    Save Config to Server
  </button>
  <button
    onClick={loadServerSettings}
    className="px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(124,58,237,0.2)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.1)]"
  >
    Load from Server
  </button>
</div>
```

Inside the API key sections, add a “Save API Keys to Server” button and status text. For example, near the OpenAI key input:

```tsx
<p className="text-xs text-[#64748B]">
  Status server: {serverKeyStatus.openai ? 'key tersimpan' : 'belum ada key'}
</p>
<button
  onClick={saveServerKeys}
  className="px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(124,58,237,0.2)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.1)]"
>
  Save API Keys to Server
</button>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: admin UI saves and loads server config and keys"
```

---

## Task 9: Update deploy script to upload the shared helper

**Files:**
- Modify: `scripts/deploy-advisor.mjs`

- [ ] **Step 1: Upload `configStore.js` alongside the proxy**

In `scripts/deploy-advisor.mjs`, add to `CONFIG`:

```js
localConfigStore: path.resolve(__dirname, '..', 'server', 'configStore.js'),
remoteConfigStore: '/var/www/advisor-configStore.js',
```

In the deploy sequence, after uploading the proxy, add:

```js
console.log('[3.5/5] Uploading config store helper...');
await ssh.putFile(CONFIG.localConfigStore, CONFIG.remoteConfigStore);
```

Before uploading `advisor-proxy.js`, rewrite the `require` path in the local file so it works on the VPS:

```js
const proxySource = fs.readFileSync(CONFIG.localProxy, 'utf8');
const productionProxySource = proxySource.replace(
  "require('../server/configStore.js')",
  "require('./advisor-configStore.js')"
);
const tempProxyPath = path.join(__dirname, '..', 'dist', 'advisor-proxy-prod.js');
fs.writeFileSync(tempProxyPath, productionProxySource);
CONFIG.localProxy = tempProxyPath; // use temp file for upload
```

Place this logic inside `deployAdvisor()` before `await ssh.putFile(CONFIG.localProxy, CONFIG.remoteProxy);`. Make sure to import `fs` at the top (it is already imported).

- [ ] **Step 2: Commit**

```bash
git add scripts/deploy-advisor.mjs
git commit -m "chore: deploy configStore.js helper to VPS"
```

---

## Task 10: End-to-end test, build, and deploy

- [ ] **Step 1: Run all local tests**

```bash
node scripts/test-configStore.mjs
node scripts/test-api-config-local.mjs
node scripts/test-proxy-config.mjs
```

Expected: all three pass.

- [ ] **Step 2: Build the app**

```bash
npm run build
```

Expected: no TypeScript errors, `dist/` created.

- [ ] **Step 3: Run a local end-to-end check**

```bash
npm run dev
```

In browser:
1. Open `http://localhost:5173/advisor/` (or whatever Vite URL is shown).
2. Go to admin, login with `jdp123`.
3. Change provider to `openai` and click **Save Config to Server**.
4. Add an API key and click **Save API Keys to Server**.
5. Refresh the page.
6. Verify the admin page loads the saved config and key status.
7. Send a chat message; verify it works.

- [ ] **Step 4: Deploy to production**

```bash
npm run deploy:advisor
```

Wait for the script to finish and health checks to pass.

- [ ] **Step 5: Verify production**

Open `https://pesat.ai/advisor/` on desktop:
1. Go to admin, set provider/model and API keys, click **Save Config to Server** and **Save API Keys to Server**.
2. Open `https://pesat.ai/advisor/` on mobile.
3. Reload the mobile page.
4. Verify mobile uses the same provider (check the admin page on mobile, or send a chat message).
5. Send a chat message on mobile; it should succeed without showing “API key invalid”.

- [ ] **Step 6: Commit and tag version**

```bash
git add -A
git commit -m "feat: server-side config and key sync (Cara C)"
```

Optionally bump `package.json` version and `VERSION.md`/`VERSIONS.md`.

---

## Self-Review Checklist

- [ ] Spec coverage: each section of the design doc is implemented by at least one task.
- [ ] No placeholders: every step includes actual commands or code.
- [ ] Type consistency: `AdvisorSettings` has `updatedAt?`, `ServerConfig` omits keys, `configStore` functions use the same names everywhere.
- [ ] Path consistency: local dev endpoints use `/api/config` and `/api/keys`; production proxy endpoints use `/config` and `/keys` because Caddy strips the `/api` prefix.
- [ ] Security: API keys are never returned to the client; keys file is outside the web root.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-21-server-config-sync-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach do you prefer?
