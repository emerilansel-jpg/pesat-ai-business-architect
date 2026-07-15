# Pesat AI Business Architect — Cold Start Guide

> For AI agents continuing this project. Read this FIRST before making any changes.

---

## Project Overview

**Name**: Pesat AI Business Architect  
**URL**: https://apps.pesat.ai/advisor/  
**Admin**: https://apps.pesat.ai/advisor/admin (password: `jdp123`)  
**Type**: AI-powered business consultant chatbot (React SPA)  
**Purpose**: Users describe their business, AI analyzes it, conducts an interview, generates a WOW report with inline visualizations, and closes with pricing/CTA.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v3 |
| Router | BrowserRouter with basename `/advisor` |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | marked |
| Image Gen | OpenAI gpt-image-1 (default), Pollinations.ai fallback |
| AI Text | OpenAI GPT-4o / DeepSeek via proxy |
| Backend | Node.js proxy on VPS managed by PM2 |
| Reverse Proxy | Dockerized Caddy via `pesat-control-plane` |
| Ingress | Cloudflare tunnel |

---

## Architecture

```
User Browser
    ↓
Cloudflare tunnel
    ↓
Caddy (pesat-control-plane) on VPS :80/:443
    ├── /api/*   → reverse_proxy → Node proxy (localhost:3002)
    └── /*       → static files  → /builds/{labels.2}
```

### Proxy Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | Text generation (OpenAI/DeepSeek) |
| `/api/image` | Image generation (OpenAI gpt-image-1) |
| `/api/search` | Web search (Tavily) |
| `/api/health` | Health check |

> **Note:** Caddy strips the `/api` prefix before forwarding to the proxy. The proxy sees `/chat`, `/image`, `/search`, `/health`.

---

## File Structure

```
src/
  App.tsx                 # Main app: routing, chat state, message flow
  main.tsx                # Entry point (no StrictMode)
  index.css               # Global styles + markdown-body + animations
  components/
    Navbar.tsx            # Top bar: logo, title, settings link
    WelcomeScreen.tsx     # Landing: particles, heading
    ChatArea.tsx          # Scrollable message list
    ChatMessage.tsx       # Individual message: markdown + inline images + choices
    ChatMessage.css       # Markdown styles
    InputBar.tsx          # Bottom input with auto-resize textarea
    ScrollToBottom.tsx    # Floating scroll-to-bottom button
    AIAvatar.tsx          # AI avatar with gradient + online dot
    ActivityPanel.tsx     # Fun game-like status panel (minion, XP bar, badges)
  contexts/
    ActivityContext.tsx   # Activity log state, typewriter effect, stage state
  pages/
    Admin.tsx             # Settings panel with password auth
  services/
    ai.ts                 # API calls: sendMessage, generateImage, webSearch, testConnection
    visualization.ts      # Parse [IMAGE:...] tags, generate image URLs
    settings.ts           # Settings interface, load/save, step prompts
    mainPrompt.ts         # MAIN_SYSTEM_PROMPT
  lib/
    utils.ts              # cn() helper
  hooks/
    use-mobile.tsx        # Mobile detection hook
```

---

## Key Features

### 1. Inline Image Visualization
AI responses can include `[IMAGE:description]` tags. These are parsed and rendered as images INLINE between text paragraphs.

**How it works**:
1. System prompt instructs AI to insert `[IMAGE:...]` tags between paragraphs.
2. `parseInlineImages()` in `visualization.ts` splits text into segments.
3. `ChatMessage.tsx` renders: text segment → image card → text segment → image card.
4. Image URLs generated via Pollinations.ai or OpenAI gpt-image-1.

### 2. Multiple Choice Buttons
AI responses end with `[CHOICE:option1|option2|option3]` tags.

**How it works**:
1. System prompt: `ALWAYS end your response with [CHOICE:...]`
2. `parseChoices()` extracts choices and removes the tag from displayed text.
3. Renders as prominent purple gradient buttons below the AI message.
4. `onClick` handler sends the selected choice.
5. "Lainnya..." button focuses the input field.

### 3. Activity Panel
Real-time, game-like status panel during AI processing.
- Desktop: right-side floating panel that collapses to a pill.
- Mobile: bottom sheet with swipe-down-to-close and floating reopen handle.
- Minion character walks, blinks, speeds up per stage, celebrates on success.
- Progress bar acts as an "XP bar" filling with each stage.
- Stages: `idle → thinking → searching → analyzing → crafting → success/error`.

### 4. Conversation Flow (7 Steps)
1. **Pembukaan + Deep Research** — Greeting + data gathering + web research.
2. **Diagnosa Awal + Validasi** — Confirm the main bottleneck with multiple choice.
3. **Interview Mendalam** — Strategic questions.
4. **Rekap Validasi** — Recap findings.
5. **WOW Report** — Comprehensive report with inline visualizations.
6. **Pricing & CTA** — ~$300 pricing.
7. **Qualify + WA** — Urgency 1-10, employee count, revenue, WA link.

### 5. Admin Panel (`/admin`)
- Password: `jdp123`
- AI Provider toggle (OpenAI <-> DeepSeek)
- Model selection
- Image generation toggle + style selector
- Web search toggle + Tavily key
- Step prompt editor (6 steps, editable per step)
- Test connection per provider
- Cost display per step

---

## Important System Prompt

The system prompt is constructed in `App.tsx` before sending to the API:

- For the **first user message**, it combines `MAIN_SYSTEM_PROMPT` + `STEP_1_FOCUS`.
- For subsequent messages, it uses `MAIN_SYSTEM_PROMPT`.
- Both are appended with inline visualization instructions, web search context, and the mandatory `[CHOICE:...]` instruction.

---

## Deployment

### VPS Details
- IP: `148.230.103.98`
- User: `root`
- Web root: `/var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/`
- Proxy script: `/var/www/advisor-proxy.js`
- Proxy port: `3002`
- Caddy config: `/opt/pesat-control-plane/caddy/Caddyfile`
- Cloudflare tunnel: `0f7602b7-07cf-4719-8e31-46f404b078c7` (`pesat-advisor-v3`)
- Cloudflare tunnel service: `systemctl status cloudflared-tunnel`

### Environment Variables
The proxy reads API keys from environment variables. They are stored in:
- `/var/www/advisor/.env` on the server (uploaded by `scripts/final-deploy.js`)
- `.env` in the project root (gitignored)

Required variables:
```bash
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
TAVILY_API_KEY=
```

### Deploy Steps
```bash
npm run build
node scripts/final-deploy.js
```

The script will:
1. Upload the proxy and `.env`.
2. Start the proxy with PM2 (sourcing `.env`).
3. Upload `dist/` to the Caddy build volume (`/var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/`).
4. Copy `index.html` to the `apps/` root.
5. Detect the Docker host IP and update the Caddy `/api/*` route.
6. Validate and restart Caddy.
7. Run quick health tests.

### Cloudflare Tunnel
A systemd service keeps the tunnel alive:
```bash
systemctl restart cloudflared-tunnel
systemctl status cloudflared-tunnel
```

The tunnel config is at `/root/.cloudflared/config.yml`:
```yaml
tunnel: 0f7602b7-07cf-4719-8e31-46f404b078c7
credentials-file: /root/.cloudflared/0f7602b7-07cf-4719-8e31-46f404b078c7.json
ingress:
  - hostname: apps.pesat.ai
    service: http://127.0.0.1:80
  - service: http_status:404
```

---

## Security Notes

- **Never commit `.env` or API keys.** They are gitignored.
- If you rotate any API key, update `.env` and re-run `scripts/final-deploy.js`.
- The old `COLDSTART.md` had hardcoded credentials; they have been removed.

---

## Session Log

### 2026-07-15 — v5.6.0 Fixes + Deployment Cleanup

- **Type:** CODING
- **Status:** COMPLETED
- **Files touched:**
  - `src/contexts/ActivityContext.tsx` — added `currentStage` and `setStage`
  - `src/components/ActivityPanel.tsx` — stage-based game mode, Quest Complete badge, XP bar
  - `src/App.tsx` — stage transitions, AbortController timeout, first-message main-prompt combo
  - `src/services/ai.ts` — `sendMessage` accepts optional `AbortSignal`
  - `src/services/settings.ts` — `STEP_1_FOCUS`, removed default keys
  - `scripts/advisor-proxy.js` — env-based API keys
  - `scripts/deploy.js` — port 3002 health check
  - `scripts/restart-proxy.js` — port 3002 health check
  - `scripts/final-deploy.js` — upload `.env` and `dist/`, dynamic Docker host IP, Caddy validation
  - `COLDSTART.md`, `VERSION.md`, `.env.example`, `.gitignore`
- **Key decisions:**
  - Moved API keys from source code to `.env` / environment variables.
  - Created new Cloudflare tunnel in the correct `pesat.ai` account (`pesat-advisor-v3`) and set up systemd service.
  - Deployment script now uploads `dist/` to the Caddy build volume instead of relying on stale assets.
- **Blockers:** Local DNS resolver (router) did not yet pick up `apps.pesat.ai` during verification; public DNS (1.1.1.1) and direct edge IP test succeeded.
- **Next step:** Wait for local DNS propagation or flush local DNS cache, then run browser end-to-end test if desired.
- **Inspector:** PASSED (build, proxy health, external chat endpoint, external HTML)
- **Backup location:** `backups/2026-07-15_1445_v5.5-fixes/`
- **coldstart.md stored at:** `D:\Claude Cowork\Pesat ai business architect\pesat-ai-business-architect\COLDSTART.md`
- **Browser used:** Edge via CDP (blocked by local DNS cache; not opened)

*Last updated: 2026-07-15 (v5.6.0)*

