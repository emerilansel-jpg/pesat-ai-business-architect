# AGENTS.md — How to Work on Pesat AI Business Architect

## 1. What This Project Is

- **Frontend:** React + Vite + TypeScript SPA.
- **Backend:** Express server (in `server/`) + a tiny proxy (`scripts/advisor-proxy.js`) running on the VPS via PM2.
- **Production URLs:**
  - `https://pesat.ai/` — Next.js homepage (separate Worker, do not touch here).
  - `https://pesat.ai/advisor/` — **Pesat AI Business Architect** app (this project).
  - `https://apps.pesat.ai/` — Currently also this app; intended for ninjago/friends apps later.

## 2. Architecture Rules (DO NOT BREAK)

| URL | Platform | Real source | Notes |
|-----|----------|-------------|-------|
| `pesat.ai/` | Cloudflare Worker `pesat-ai-homepage` | Pages/Worker | Do NOT point DNS root to VPS. |
| `pesat.ai/advisor/*` | Cloudflare Worker `pesat-advisor-proxy` | Proxies to `apps.pesat.ai/advisor/` | Preserves URL in browser. |
| `apps.pesat.ai/advisor/` | VPS Caddy + Docker volume | `/var/lib/docker/volumes/pesat-control-plane_builds/_data/apps/advisor/` | Served by wildcard `*.pesat.ai` block. |
| `apps.pesat.ai/` | VPS Caddy | `/var/lib/docker/volumes/.../_data/apps/index.html` | Currently Business Architect; should be ninjago/friends. |

## 3. Safe Operations

### Build the app
```bash
npm run build
```
Produces `dist/` with `base=/advisor/`.

### Deploy only the Business Architect
```bash
node scripts/deploy-advisor.mjs
```
This will:
- Backup the VPS first.
- Upload `dist/` only to `/builds/apps/advisor/` (Business Architect folder).
- Upload/restart the proxy on port 3002.
- Run health checks.

### Health checks
```bash
node scripts/health-check.mjs
```

### Backup VPS state
```bash
node scripts/backup-vps.mjs backup
node scripts/backup-vps.mjs list
node scripts/backup-vps.mjs restore <timestamp> --confirm
```

### Deploy a different static app (e.g. ninjago)
```bash
node scripts/deploy-static-app.mjs ninjago D:/path/to/ninjago/dist
```
This will:
- Backup the VPS first.
- Upload to `/builds/apps/ninjago/`.
- If app name is `landing`, also copies `index.html` to `/builds/apps/index.html` for the apps root page.

## 4. Dangerous Operations (ASK USER FIRST)

- **Do NOT run `scripts/final-deploy.js` or `scripts/deploy.js` unless explicitly told.** These scripts touch the root `/builds/apps/index.html` and can overwrite other apps.
- **Do NOT point `pesat.ai` DNS directly to the VPS.** The homepage lives on a Cloudflare Worker.
- **Do NOT edit `Caddyfile` without a backup.** Always run `node scripts/backup-vps.mjs backup` first.
- **Do NOT use 301 redirects while testing.** Use 302 (temporary) until the architecture is confirmed.
- **Do NOT delete or move `/builds/apps/advisor/` while the Worker proxy is active.**

## 5. Adding a New App

1. Place the built static files in a folder on this machine.
2. Choose a unique app name (e.g. `games`, `tools`, `ninjago`).
3. Run:
   ```bash
   node scripts/deploy-static-app.mjs <name> <local-folder>
   ```
4. Verify with:
   ```bash
   node scripts/health-check.mjs
   ```
   Add the new URL to `scripts/health-check.mjs` if it should be monitored.

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `pesat.ai/` blank or shows app | Cache from old 301 redirect | Hard refresh, disable cache, or clear browser cache. |
| `pesat.ai/advisor/` 404 | Worker proxy route missing or Caddy down | Check Cloudflare Worker `pesat-advisor-proxy` route; check Caddy container. |
| `apps.pesat.ai/` shows Business Architect | `apps/index.html` still from old deploy | Deploy ninjago/friends or run `deploy-static-app.mjs landing ...`. |
| `apps.pesat.ai/<app>/` 404 | Folder missing in `/builds/apps/<app>/` | Deploy the app with `deploy-static-app.mjs`. |

## 7. Key Files

- `scripts/backup-vps.mjs` — Backup and restore VPS state.
- `scripts/deploy-advisor.mjs` — Deploy only the Business Architect.
- `scripts/deploy-static-app.mjs` — Deploy any static app safely.
- `scripts/health-check.mjs` — Verify production URLs.
- `scripts/fix-caddy-redirects.mjs` — Caddy config template (use with care).
- `COLDSTART.md` — Full project history and decisions.
- `VERSIONS.md` — Changelog and version source of truth.

## 8. If You Are Unsure

- Read `COLDSTART.md` first.
- Run `node scripts/health-check.mjs` to see current state.
- Do NOT modify DNS, Caddyfile, or Worker routes without user approval.
- Backup first: `node scripts/backup-vps.mjs backup`.
