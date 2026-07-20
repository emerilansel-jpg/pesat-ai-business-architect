// Auto-generated from VERSIONS.md. Do not edit manually.
export interface VersionEntry {
  version: string;
  date: string;
  type: 'MAJOR' | 'FEATURE' | 'FIX' | string;
  changes: string[];
  latest?: boolean;
}

export const versions: VersionEntry[] = [
  {
    "version": "5.13.1",
    "date": "20 Jul 2026",
    "type": "FIX",
    "changes": [
      "Fixed 404 on `https://pesat.ai/advisor/` by restoring the Cloudflare DNS A record to the VPS origin.",
      "Removed the Cloudflare Worker custom domain (`pesat-ai-homepage`) from `pesat.ai` so requests reach the VPS Caddy server.",
      "Rebuilt and redeployed the latest `dist/` to the VPS build volume.",
      "Added canonical redirect: `https://apps.pesat.ai/advisor/*` → `https://pesat.ai/advisor/`.",
      "Added `VERSIONS.md` and the in-app `/version` page."
    ],
    "latest": true
  },
  {
    "version": "5.13.0",
    "date": "21 Jul 2026",
    "type": "UI/UX",
    "changes": [
      "Fixed duplicate \"Lainnya\" buttons: filtered out any AI-generated choice containing \"Lainnya\" or \"ketik sendiri\".",
      "Enforced \"aku/kamu\" or \"saya/anda\" persona; forbidden \"gue/lo\" in AI responses.",
      "Reduced mobile activity panel bottom sheet from 70vh to 55vh and exposed a CSS variable so the chat area keeps bubbles visible.",
      "Strengthened image placement prompts to require images at top, middle, and bottom of sections.",
      "Added stronger visual section separation in AI messages with vertical spacing and border-top dividers.",
      "WhatsApp CTA now renders as a clickable green button using `[CTA:https://wa.me/...]` tag.",
      "Improved API error message to suggest checking provider/API key and server `.env`."
    ],
    "latest": false
  }
];
