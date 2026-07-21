# Design — Server-Side Config & API Key Sync for Pesat AI Business Architect

**Date:** 2026-07-21  
**Status:** Approved  
**Scope:** Move all app settings (except user chat history) to the server so desktop and mobile stay in sync. API keys are kept server-side only and never sent to the browser. Admin UI remains the place to manage provider, model, preferences, and keys.

---

## Goals

1. **Single source of truth** for non-sensitive settings: provider, model, image preferences, web search, step prompts, etc. live in a server-side config file.
2. **Single source of truth** for API keys: OpenAI, DeepSeek, and Tavily keys are stored in a server-side keys file and never transmitted to the client.
3. **All devices use the same configuration** after the admin saves changes on any device.
4. **Admin UI stays usable** for both configuration and API key management.
5. **Default provider is DeepSeek** to avoid the current `insufficient_quota` issue on the server-side OpenAI key.

---

## Context

Currently, the app stores all settings — including API keys — in `localStorage`. Because `localStorage` is per-browser, a user who sets DeepSeek on desktop will still see the default OpenAI provider on mobile. That causes the mobile error “API key di server invalid atau quota habis” because the server-side OpenAI key has exceeded its quota, while the server-side DeepSeek key is still valid.

We will keep the existing `advisor-proxy.js` / `server/index.ts` as the backend, and add small endpoints to read/write a server-side config and keys file.

---

## Section 1 — Server-Side Storage

### 1.1 Config file: `/var/www/advisor-config.json`

Stores non-sensitive settings. Initial content will be derived from the current `DEFAULT_SETTINGS` minus the API keys.

Example:

```json
{
  "textProvider": "deepseek",
  "imageProvider": "openai-image",
  "openaiModel": "gpt-4o",
  "deepseekModel": "deepseek-chat",
  "autoImageGen": true,
  "imageStyle": "professional",
  "maxImagesPerResponse": 1,
  "webSearchEnabled": true,
  "stepPrompts": [...],
  "promptVersion": 4,
  "updatedAt": "2026-07-21T10:00:00.000Z"
}
```

Notes:
- `updatedAt` is a UTC timestamp used by the client to decide whether server config is newer than local config.
- The file lives outside the web root (`/var/www/`) and is not served by Caddy.
- For local development, the same file is stored in the project root as `./advisor-config.json`.

### 1.2 Keys file: `/var/www/advisor-keys.json`

Stores the actual API keys.

Example:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "DEEPSEEK_API_KEY": "sk-...",
  "TAVILY_API_KEY": "tvly-..."
}
```

Notes:
- The keys file is **never** returned to the client.
- It is read by the proxy when a client request does not provide its own key.
- If a key is missing from the file, the proxy falls back to the existing environment variables (`OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`).
- The file is only readable by root / the proxy process.
- For local development, the same file is stored in the project root as `./advisor-keys.json`.

---

## Section 2 — Backend Endpoints

All new endpoints are added to both `scripts/advisor-proxy.js` (production) and `server/index.ts` (local development) for parity.

### 2.1 `GET /api/config`

**Public.** Returns the non-sensitive config plus flags that tell the UI which API keys are available on the server.

Response example:

```json
{
  "textProvider": "deepseek",
  "imageProvider": "openai-image",
  "openaiModel": "gpt-4o",
  "deepseekModel": "deepseek-chat",
  "autoImageGen": true,
  "imageStyle": "professional",
  "maxImagesPerResponse": 1,
  "webSearchEnabled": true,
  "stepPrompts": [...],
  "promptVersion": 4,
  "updatedAt": "2026-07-21T10:00:00.000Z",
  "hasOpenAiKey": true,
  "hasDeepseekKey": true,
  "hasTavilyKey": true
}
```

Behavior:
- If the config file is missing, the proxy creates it with the built-in default config (DeepSeek provider) and returns that default.
- The `has*` flags are derived from the keys file (or environment fallback), not the actual key values.

### 2.2 `POST /api/config`

**Admin-only.** Writes the non-sensitive config to `/var/www/advisor-config.json`.

Request body:

```json
{
  "adminPassword": "jdp123",
  "config": { ... }
}
```

Behavior:
- Validate `adminPassword` against `process.env.ADMIN_PASSWORD` (or fallback to the existing client password `jdp123`).
- Strip any API key fields that might accidentally be included.
- Update `updatedAt` to the current UTC time.
- Write the JSON atomically to `/var/www/advisor-config.json`.
- Return `{ success: true }` or `{ error: "..." }`.

### 2.3 `POST /api/keys`

**Admin-only.** Writes API keys to `/var/www/advisor-keys.json`.

Request body:

```json
{
  "adminPassword": "jdp123",
  "keys": {
    "OPENAI_API_KEY": "sk-...",
    "DEEPSEEK_API_KEY": "sk-...",
    "TAVILY_API_KEY": "tvly-..."
  }
}
```

Behavior:
- Validate `adminPassword`.
- Merge the provided keys with the existing keys file. An empty string in the request means **do not change** that key, so a user who only updates one key does not accidentally erase the others. Only non-empty values are written.
- Write the JSON atomically to `/var/www/advisor-keys.json`.
- Return `{ success: true }`.
- Never return the key values in the response.

### 2.4 Proxy usage of keys

In `advisor-proxy.js` and `server/index.ts`, change the fallback logic from:

```js
const apiKey = data.apiKey || OPENAI_API_KEY;
```

to:

```js
const keys = loadServerKeys(); // reads /var/www/advisor-keys.json, falls back to env
const apiKey = data.apiKey || keys.OPENAI_API_KEY;
```

If the client sends an empty `apiKey`, the server-side key is used. This preserves the existing behavior while letting the server keys be updated via the admin UI.

---

## Section 3 — Client-Side Changes

### 3.1 Remove key storage from `localStorage`

In `src/services/settings.ts`:
- Keep the `AdvisorSettings` interface for UI convenience, but the API key fields (`openaiKey`, `deepseekKey`, `tavilyKey`) are **not persisted to `localStorage`**.
- Default values for the key fields are empty strings; the real keys live on the server.
- For backward compatibility, existing key entries in `localStorage` are ignored after the first successful server sync.
- Change the default `textProvider` from `openai` to `deepseek`.

### 3.2 Fetch server config on startup

In `src/App.tsx` (or a new `src/services/serverConfig.ts`):

```ts
export async function fetchServerConfig(): Promise<ServerConfig | null> { ... }
```

On app load:
1. Load local settings from `localStorage`.
2. Fetch `GET /api/config`.
3. If the server config has a newer `updatedAt`, merge it into local settings and save to `localStorage`.
4. If the fetch fails, continue with local settings.

### 3.3 Admin UI changes

In `src/pages/Admin.tsx`:

- **Provider / model / preferences:** When the user changes a setting, save it to the server via `POST /api/config` (instead of only localStorage). Keep localStorage in sync for offline rendering.
- **API key inputs:** Keep the input fields for OpenAI, DeepSeek, and Tavily keys. On save, send them to `POST /api/keys` and clear the local input state. Do **not** store them in `localStorage`.
- **Key status indicators:** Use the `hasOpenAiKey`, `hasDeepseekKey`, `hasTavilyKey` flags from `GET /api/config` to show whether a key is saved on the server.
- **“Load from Server” button:** Allow the user to explicitly pull the latest config from the server.
- **“Save to Server” button:** Allow the user to explicitly push the current config to the server.

### 3.4 Default provider

Change the default provider to `deepseek` in both:
- The server default config (when the config file is missing).
- The client-side `DEFAULT_SETTINGS` in `src/services/settings.ts`.

This ensures new devices and cleared browsers immediately use the working provider.

---

## Section 4 — Security Notes

1. **API keys never leave the server.**
   - `GET /api/config` only returns availability flags.
   - The keys file is not inside the web root.
2. **Admin password is required to write.**
   - Password is sent over HTTPS.
   - The server checks `process.env.ADMIN_PASSWORD` with a fallback to the existing client password.
3. **File permissions.**
   - `/var/www/advisor-config.json` and `/var/www/advisor-keys.json` should be readable only by the proxy process (e.g., `chmod 600`).
4. **Atomic writes.**
   - Config and keys files should be written to a temporary file and renamed to avoid corruption on crash.

---

## Section 5 — Deployment & Migration

1. **Update proxy files:**
   - `scripts/advisor-proxy.js` (production)
   - `server/index.ts` (local development)

2. **Run `deploy-advisor.mjs`** to upload the new proxy to the VPS and restart the PM2 process.

3. **Create initial config file on the server.**
   - The proxy can auto-create the default config on the first `GET /api/config` request.
   - The initial default provider will be `deepseek`.

4. **Migration for existing users.**
   - Existing clients with keys in `localStorage` will stop using them after the server config is loaded.
   - The admin must re-enter the desired API keys once via the admin UI; from then on they are stored on the server.

5. **No changes to Caddy.**
   - The new `/api/config` and `/api/keys` endpoints are handled by the same proxy on port 3002.

---

## Section 6 — Testing Plan

### Local development
1. Start the dev server: `npm run dev`.
2. Open admin page, set provider to DeepSeek, save.
3. Verify `server/advisor-config.json` (or local equivalent) is created.
4. Enter an API key in the admin UI, save.
5. Verify the key is saved in the local keys file but **not** in `localStorage`.
6. Send a chat message and verify it uses the server-side key.
7. Clear `localStorage`, reload the app, and verify it loads the server config (DeepSeek provider).

### Production
1. Run `node scripts/deploy-advisor.mjs`.
2. Verify `/api/config` returns the default config with DeepSeek provider.
3. On desktop, open admin, set provider/model and API keys, save to server.
4. On mobile, reload the app and verify it loads the same provider/model without requiring a key entry.
5. Send a chat message on mobile and verify it succeeds.
6. Change provider to OpenAI in admin (after updating the server OpenAI key) and verify mobile follows the change after reload.

---

## Files Expected to Change

- `scripts/advisor-proxy.js` — add endpoints and server-side key loading.
- `server/index.ts` — add endpoints and server-side key loading for local dev.
- `src/services/settings.ts` — remove key defaults, change default provider to DeepSeek.
- `src/services/serverConfig.ts` — new helper to fetch server config.
- `src/pages/Admin.tsx` — save config/keys to server, show key status, add load/save buttons.
- `src/App.tsx` — fetch server config on startup and merge with local settings.
- `src/services/ai.ts` — stop sending local keys; rely on server fallback (client can still send empty `apiKey`).
- `deploy-advisor.mjs` — ensure the new proxy is restarted and env files are preserved.

---

## Open Questions / Notes

- Should the server auto-rotate or backup the keys file? For now, manual backup before deploy is sufficient.
- The admin password fallback (`jdp123`) should ideally be moved to an environment variable in the future.
