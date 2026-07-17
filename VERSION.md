# Version History

## v5.7.0 — 2026-07-17
- Type: Feature / Bug Fix
- Changes:
  - Redesigned mobile ActivityPanel into a Kimi agent-style bottom sheet that slides up to 70% of the screen.
  - Added a drag handle at the top of the mobile sheet; users can drag it down to collapse.
  - When collapsed, a persistent mini horizontal bar floats above the input bar and reopens the sheet on tap.
  - Fixed ActivityPanel status bug where the message could still read like an active processing step after the AI finished; fun message now follows the current icon/stage correctly.
  - Strengthened language default: Bahasa Indonesia is the default; English is used only when the user clearly writes in English.
  - Added a focused first-message instruction so the opening response follows the main prompt and asks for business details naturally.
  - Bumped prompt version to auto-reset cached step prompts in localStorage.
- Files touched:
  - `src/components/ActivityPanel.tsx`
  - `src/contexts/ActivityContext.tsx`
  - `src/App.tsx`
  - `src/services/settings.ts`
  - `src/services/mainPrompt.ts`
  - `package.json`
  - `VERSION.md`
- Breaking: no


## v5.6.2 — 2026-07-17
- Type: Bug Fix / UI Polish
- Changes:
  - Refined mobile chat to feel closer to Kimi agents app: softer avatar glow, cleaner navbar, rounder message bubbles, and lighter user bubble shadow.
  - Mobile choice buttons now stack full-width instead of wrapping into a grid, matching native mobile chat patterns.
  - Improved touch targets for Copy/Retry actions and made the input bar more pill-shaped on mobile.
  - Replaced the distorted scaled-minion ActivityPanel mobile indicator with a clean spinner/icon badge.
  - Reduced mobile chat spacing and padding for a denser, more app-like feel.
- Files touched:
  - `src/components/WelcomeScreen.tsx`
  - `src/components/Navbar.tsx`
  - `src/components/ChatMessage.tsx`
  - `src/components/InputBar.tsx`
  - `src/components/ActivityPanel.tsx`
  - `src/components/ChatArea.tsx`
  - `src/components/TypingIndicator.tsx`
  - `package.json`
  - `VERSION.md`
- Breaking: no


## v5.6.1 — 2026-07-16
- Type: Bug Fix / UI Polish
- Changes:
  - Redesigned mobile view to look and feel like a native mobile chat app (Kimi-style).
  - Mobile now uses a light theme: white background, light gray AI bubbles, and a floating rounded input bar.
  - Replaced the large mobile ActivityPanel bottom sheet with a compact floating status card above the input.
  - Kept the dark desktop experience unchanged.
  - Added missing CSS utilities for AI avatar glow, online pulse, and typing dot animations.
  - Fixed AI message text color on mobile so it remains readable against the light bubble.
- Files touched:
  - `src/index.css`
  - `src/App.tsx`
  - `src/components/Navbar.tsx`
  - `src/components/ChatArea.tsx`
  - `src/components/ChatMessage.tsx`
  - `src/components/InputBar.tsx`
  - `src/components/TypingIndicator.tsx`
  - `src/components/ScrollToBottom.tsx`
  - `src/components/WelcomeScreen.tsx`
  - `src/components/ActivityPanel.tsx`
  - `src/components/AIAvatar.tsx`
  - `package.json`
  - `VERSION.md`
- Breaking: no


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
