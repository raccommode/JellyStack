# JellyStack

> The complete Jellyfin media stack as a single Umbrel app. One install, one dashboard, zero config.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Lint](https://github.com/raccommode/JellyStack/actions/workflows/lint.yml/badge.svg)](https://github.com/raccommode/JellyStack/actions/workflows/lint.yml)
[![Status](https://img.shields.io/badge/status-early%20development-orange.svg)](#roadmap)

JellyStack is a **monolithic Umbrel app**: one tile in the App Store installs Jellyfin, the *arr suite, download clients, VPN, monitoring, automation, and media extras — **~30 containers, pre-wired to each other**. The JellyStack panel is the only UI you ever need: it auto-detects every bundled service, reads their API keys out of disk, wires Prowlarr to the *arr apps, registers qBittorrent and SABnzbd as download clients, and gives you a single dashboard to manage all of it.

No terminal. No `.env` editing. No hunting for API keys. No 30 separate Umbrel tiles cluttering your home.

> **Status:** under active development. Not yet ready for general use — follow the repo for v1.0.0.

## Highlights

- **One-click install.** Add the community app store → install JellyStack → done.
- **Auto-config wizard.** Welcome screen walks through the handful of decisions that actually need you; everything else is wired automatically through each app's REST API.
- **Unified UI.** Every bundled app is reachable from the panel sidebar through a reverse-proxied iframe.
- **Hard-link-friendly storage.** Media and downloads live under `/home/umbrel/umbrel/JellyStack`, so qBittorrent imports are instant (no disk copy, seeding stays intact).
- **Internationalized.** Ships in English and French; new languages are a 3-step translation file away.
- **Typed, tested, linted.** TypeScript strict mode, ESLint, YAML validators, i18n key diff on every PR.

## What's in the box

| Category | Apps |
|---|---|
| **Media core** | Jellyfin, Sonarr, Radarr, Lidarr, Readarr, Bazarr, Prowlarr |
| **Requests** | Jellyseerr |
| **Download** | qBittorrent, SABnzbd, JDownloader2, Gluetun (VPN), FlareSolverr |
| **Monitoring** | Tautulli, Jellystat (+ Postgres 15), Dozzle |
| **Automation** | Unpackerr, Decluttarr, Cross-seed, Autobrr, Janitorr, Profilarr |
| **Transcoding** | Tdarr (server + internal node, Intel/NVIDIA pass-through) |
| **Extras** | Kapowarr, Wizarr, Navidrome, Kavita, Audiobookshelf |
| **★ JellyStack Panel** | Custom Next.js dashboard that orchestrates the stack |

## Quick start

1. **Add the store to umbrelOS** — *Settings → App Stores → Add* `https://github.com/raccommode/JellyStack`.
2. **Install JellyStack** from the store.
3. **Open the panel** — follow the welcome wizard (usually under a minute).

Once the wizard is done, the Prowlarr ↔ *arr ↔ qBittorrent/SABnzbd wiring is in place, media paths are registered (`/data/media/movies`, `/data/media/tv`, …), and your Umbrel is ready to receive your library.

## Architecture

```
        ┌─────────────────────────────────────────────────────────┐
        │                    Umbrel app_proxy                     │
        │        (auth + single entry to the JellyStack app)      │
        └───────────────────────────┬─────────────────────────────┘
                                    ↓
                           ┌────────────────┐
                           │ JellyStack     │ ←── /proxy/sonarr/* → http://sonarr:8989
                           │ Panel (Next.js)│ ←── /proxy/radarr/* → http://radarr:7878
                           └───────┬────────┘    (reverse-proxied iframes)
                                   │
          ┌────────────────────────┼────────────────────────────────┐
          │           Shared compose network (bridge)                │
          │                                                          │
          │  jellyfin    sonarr    radarr    lidarr    readarr       │
          │  bazarr      prowlarr  qbittorrent  sabnzbd  gluetun     │
          │  jellyseerr  tautulli  jellystat (+db)  dozzle  …        │
          │                                                          │
          └──────────────────────────────────────────────────────────┘

  /home/umbrel/umbrel/JellyStack/           ← bound into every container as /data
  ├── downloads/
  │   ├── torrents/{movies,tv,music,books}
  │   ├── usenet/
  │   └── direct/
  └── media/
      ├── movies/   tv/   music/   books/   audiobooks/   comics/
```

**Why monolithic?** Because a media stack is only useful when its pieces are wired to each other. Shipping 30 separate Umbrel apps means users have to install them one by one, then copy-paste API keys between tabs for 20 minutes to wire them together. JellyStack sidesteps that entirely.

## Repository layout

```
JellyStack/
├── umbrel-app-store.yml      # community app store id: "jellystack"
├── jellystack-app/           # the single Umbrel app
│   ├── umbrel-app.yml        # id: jellystack-app
│   ├── docker-compose.yml    # monolithic compose — ~30 services
│   ├── Dockerfile            # Next.js panel multi-stage build
│   ├── messages/             # i18n — en.json is source of truth
│   └── src/
│       ├── app/
│       │   ├── [locale]/     # localized pages (/en, /fr, …)
│       │   │   ├── page.tsx          # Dashboard (live health)
│       │   │   ├── apps/[id]/        # Iframe viewer per service
│       │   │   ├── wizard/           # 6-step setup wizard
│       │   │   └── settings/         # Global settings
│       │   ├── api/          # discover, secrets, integrate, health
│       │   └── proxy/[service]/[[...path]]/   # reverse proxy
│       ├── lib/
│       │   ├── services.ts           # single source of truth (26 services)
│       │   ├── umbrel.ts             # helpers over the registry
│       │   ├── secrets.ts            # API-key extraction from config files
│       │   ├── clients/              # arr, prowlarr, qbittorrent, jellyfin…
│       │   └── integration/          # prowlarr-to-arr, qbit-to-arr, paths
│       └── components/       # sidebar, dashboard-grid, wizard steps…
├── shared/
│   ├── env.example           # PUID/PGID/TZ, Mullvad placeholders…
│   └── docs/                 # Gluetun setup, GPU transcoding
├── scripts/
│   ├── validate-compose.py   # Umbrel-aware compose validator
│   └── validate-manifest.py  # enforces manifest schema
└── .github/workflows/lint.yml
```

## Internationalization

The panel ships with **English** and **French**. Adding another language is three steps:

1. Copy `jellystack-app/messages/en.json` to `<lang>.json` (e.g. `de.json`).
2. Translate the values — keys and ICU placeholders stay intact.
3. Register the code in `jellystack-app/src/i18n/config.ts`.

CI runs `pnpm i18n:check` on every PR to make sure new keys land in every locale. Full guide in [`jellystack-app/messages/README.md`](./jellystack-app/messages/README.md).

## Contributing

PRs welcome. All contributions must pass:

```bash
python3 scripts/validate-compose.py        # pinned tags, services registry in sync
python3 scripts/validate-manifest.py       # Umbrel schema
pnpm --dir jellystack-app typecheck        # TypeScript strict
pnpm --dir jellystack-app i18n:check       # locales mirror en.json
pnpm --dir jellystack-app lint             # ESLint
```

See [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) for the PR checklist.

## Development

```bash
# Panel (Next.js)
pnpm --dir jellystack-app install
pnpm --dir jellystack-app dev              # http://localhost:3000

# Validators
python3 scripts/validate-compose.py
python3 scripts/validate-manifest.py

# Build the panel image (pushed to ghcr.io/raccommode/jellystack-panel)
docker build -t jellystack-panel:dev jellystack-app
```

## Roadmap

- [x] Single-app monolithic architecture
- [x] Panel MVP: dashboard, iframe viewer, reverse proxy, live health
- [x] Auto-config wizard (Prowlarr ↔ *arr ↔ qBit/SAB)
- [x] EN/FR translations, extensible i18n
- [ ] Detailed settings screens (VPN credentials UI, media path editor, user invites via Wizarr)
- [ ] Jellyfin token read from SQLite (remove the manual token step)
- [ ] WebSocket forwarding in the proxy for live-update apps
- [ ] Automated screenshots + demo GIF for the README
- [ ] Published image on `ghcr.io/raccommode/jellystack-panel`
- [ ] v1.0.0 release

## License

[MIT](./LICENSE)
