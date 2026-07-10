# Pesat AI Business Architect — Cold Start Guide

> For AI agents continuing this project. Read this FIRST before making any changes.

---

## Project Overview

**Name**: Pesat AI Business Architect
**URL**: https://apps.pesat.ai/advisor/
**Type**: AI-powered business consultant chatbot (React SPA)
**Purpose**: Users describe their business, AI analyzes it, conducts interview, generates WOW report with inline visualizations, and closes with pricing/CTA.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v3 |
| Router | HashRouter (react-router-dom) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | marked |
| Image Gen | Pollinations.ai (Flux model, free) |
| AI Text | OpenAI GPT-4o / DeepSeek via proxy |
| Backend | Node.js proxy on VPS (nginx reverse proxy) |

---

## Architecture

```
User Browser <- Nginx (80/443) <- Node Proxy (localhost:3000) <- OpenAI/DeepSeek API
                    |
               Static Files
               (/var/www/advisor/)
```

### Proxy Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | Text generation (OpenAI/DeepSeek) |
| `/api/image` | Image generation (DALL-E) |
| `/api/search` | Web search (Tavily) |
| `/api/health` | Health check |

---

## File Structure

```
src/
  App.tsx                 # Main app: routing, chat state, message flow
  main.tsx                # Entry point (no StrictMode)
  index.css               # Global styles + markdown-body + animations
  components/
    Navbar.tsx            # Top bar: logo, title, settings link
    WelcomeScreen.tsx     # Landing: particles, heading, NO conversation chip
    ChatArea.tsx          # Scrollable message list
    ChatMessage.tsx       # Individual message: markdown + inline images + choices
    ChatMessage.css       # Markdown styles
    InputBar.tsx          # Bottom input with auto-resize textarea
    ScrollToBottom.tsx    # Floating scroll-to-bottom button
    AIAvatar.tsx          # AI avatar with gradient + online dot
  pages/
    Admin.tsx             # Settings panel with password auth
  services/
    ai.ts                 # API calls: sendMessage, generateImage, webSearch, testConnection
    visualization.ts      # Parse [IMAGE:...] tags, generate Pollinations URLs
    settings.ts           # Settings interface, load/save, step prompts
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
1. System prompt instructs AI to insert `[IMAGE:...]` tags between paragraphs
2. `parseInlineImages()` in `visualization.ts` splits text into segments
3. `ChatMessage.tsx` renders: text segment -> image card -> text segment -> image card
4. Image URLs generated via Pollinations.ai with deterministic seed

**Image model**: `model=flux` (Pollinations.ai)

### 2. Multiple Choice Buttons
AI responses end with `[CHOICE:option1|option2|option3]` tags.

**How it works**:
1. System prompt: `ALWAYS end your response with [CHOICE:...]`
2. `parseChoices()` extracts choices and removes tag from displayed text
3. Renders as prominent purple gradient buttons below AI message
4. `onClick` handler
5. "Lainnya... (ketik sendiri)" button focuses input field

### 3. Conversation Flow (6 Steps)
1. **Deep Research** — AI analyzes business info
2. **Interview (3 questions)** — Strategic questions
3. **Summary & Confirm** — Recap findings
4. **WOW Report** — Comprehensive report with inline visualizations
5. **Pricing & CTA** — ~$300 pricing
6. **Qualify + WA** — Urgency 1-10, employee count, revenue, WA link

### 4. Admin Panel (`/#/admin`)
- Password: `jdp123`
- AI Provider toggle (OpenAI <-> DeepSeek)
- Model selection (gpt-4o/4.1/4.5/5, deepseek-chat/reasoner)
- Image generation toggle + style selector
- Web search toggle + Tavily key
- Step prompt editor (6 steps, editable per step)
- Test connection per provider
- Cost display per step

---

## Important System Prompt

The system prompt is constructed in `App.tsx` before sending to API:
```
You are Pesat AI Business Architect...
[inline visualization instructions]
ALWAYS end with [CHOICE:option1|option2|option3]
```

---

## Deployment

### VPS Details
- IP: `94.100.26.189`
- User: `root`
- Pass: `ymif5avvYc`
- Web root: `/var/www/advisor/`
- Backup: `/var/www/advisor-backup/`
- Proxy script: `/var/www/advisor-proxy.js`

### Deploy Steps
```bash
npm run build
# Copy dist/ to /var/www/advisor/
# Restart proxy if needed
```

---

## Quick Commands

```bash
# Build
npm run build

# Test proxy
curl http://94.100.26.189/api/health

# Restart proxy
pkill -f advisor-proxy.js
cd /var/www && nohup node advisor-proxy.js > /var/log/advisor-proxy.log 2>&1 &
```

---

*Last updated: 2026-07-06 (v5.3)*
