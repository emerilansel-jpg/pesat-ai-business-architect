## v5.14.0 — 21 Jul 2026 — FEATURE
- Moved provider, model, image preference, web search, and step prompts to a server-side config file so desktop and mobile stay in sync.
- Moved API keys (OpenAI, DeepSeek, Tavily) to a server-side keys file; they are no longer stored in the browser.
- Added `/api/config` and `/api/keys` endpoints to both the local dev server and the production proxy.
- Added "Save Config to Server", "Load from Server", and "Save API Keys to Server" buttons to the admin panel.
- Changed the default text provider to DeepSeek to avoid the current OpenAI quota issue on the server-side key.
- Updated the deploy script to upload the shared config store helper alongside the proxy.

## v5.13.1 — 20 Jul 2026 — FIX
- Fixed 404 on `https://pesat.ai/advisor/` by restoring the Cloudflare DNS A record to the VPS origin.
- Removed the Cloudflare Worker custom domain (`pesat-ai-homepage`) from `pesat.ai` so requests reach the VPS Caddy server.
- Rebuilt and redeployed the latest `dist/` to the VPS build volume.
- Added canonical redirect: `https://apps.pesat.ai/advisor/*` → `https://pesat.ai/advisor/`.
- Added `VERSIONS.md` and the in-app `/version` page.

## v5.13.0 — 21 Jul 2026 — UI/UX
- Fixed duplicate "Lainnya" buttons: filtered out any AI-generated choice containing "Lainnya" or "ketik sendiri".
- Enforced "aku/kamu" or "saya/anda" persona; forbidden "gue/lo" in AI responses.
- Reduced mobile activity panel bottom sheet from 70vh to 55vh and exposed a CSS variable so the chat area keeps bubbles visible.
- Strengthened image placement prompts to require images at top, middle, and bottom of sections.
- Added stronger visual section separation in AI messages with vertical spacing and border-top dividers.
- WhatsApp CTA now renders as a clickable green button using `[CTA:https://wa.me/...]` tag.
- Improved API error message to suggest checking provider/API key and server `.env`.
