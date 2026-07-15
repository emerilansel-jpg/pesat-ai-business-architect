# Version History

## v5.6.0 — 2026-07-15
- Type: Feature / Bug Fix / Deployment Cleanup
- Changes:
  - ActivityPanel: stage-based game-mode animations, “Quest Complete” badge, and dynamic progress bar.
  - Fixed stuck “crafting response” status with AbortController timeout and guaranteed log completion.
  - First user message now uses MAIN_SYSTEM_PROMPT + Step 1 focus for stronger persona alignment.
  - Moved API keys from source code to `.env` and updated proxy to read from environment variables.
  - Fixed deployment health checks to use proxy port 3002.
  - Made Caddy `/api/*` routing robust with `handle_path` and dynamic Docker host IP detection.
  - Refreshed `COLDSTART.md` to reflect current BrowserRouter, Caddy, and Cloudflare tunnel architecture.
- Files touched:
  - `src/contexts/ActivityContext.tsx`
  - `src/components/ActivityPanel.tsx`
  - `src/App.tsx`
  - `src/services/settings.ts`
  - `src/services/ai.ts`
  - `scripts/advisor-proxy.js`
  - `scripts/deploy.js`
  - `scripts/restart-proxy.js`
  - `scripts/final-deploy.js`
  - `COLDSTART.md`
  - `.env` / `.env.example`
  - `.gitignore`
- Breaking: no

## v5.5.0 — 2026-07-14
- Type: Bug Fix / Feature
- Changes:
  - Redesigned Activity Panel to be fun and game-like: animated minion character that walks, blinks, and celebrates on completion.
  - Added entertaining status messages, progress bar, and random fun facts after completion.
  - Fixed Activity Panel status bug where it could still show "crafting response" after the AI finished.
  - Fixed first-message behavior: now uses the focused Step 1 prompt so the AI asks for business details and follows the main-prompt flow from the start.
  - Strengthened production proxy body-size handling and logging to avoid large-request failures.
- Files touched:
  - `src/contexts/ActivityContext.tsx`
  - `src/components/ActivityPanel.tsx`
  - `src/App.tsx`
  - `src/services/settings.ts`
  - `server/index.ts`
  - `scripts/advisor-proxy.js`
  - `package.json`
  - `VERSION.md`
- Breaking: no

## v5.4.0 — 2026-07-14
- Type: Feature
- Changes:
  - Added real-time Activity Panel during AI processing with typewriter-effect status updates.
  - Desktop: right-side floating panel that collapses to a pill.
  - Mobile: bottom sheet with swipe-down-to-close and floating reopen handle.
  - Integrated activity logging into the chat flow: Thinking → Searching web → Analyzing → Crafting response → Generating visual.
  - Switched image generation to manual by default: users click "Generate visual" instead of waiting for auto-generation.
  - Auto-generate toggle remains available in admin for users who prefer the old behavior.
- Files touched:
  - `src/contexts/ActivityContext.tsx` (new)
  - `src/components/ActivityPanel.tsx` (new)
  - `src/App.tsx`
  - `src/components/ChatMessage.tsx`
  - `src/services/settings.ts`
- Breaking: no
