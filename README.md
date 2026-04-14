# JellyStack

> The complete Jellyfin media stack as a single Umbrel app. One install, one dashboard, zero config.

**Status: under active development — not yet ready for general use.**

JellyStack is a **monolithic Umbrel app**: install one tile from the App Store and you get Jellyfin, the *arr suite, download clients, monitoring, automation and extras — ~30 services — running side-by-side and pre-wired to each other. The JellyStack panel is the only UI you need: it auto-detects each bundled service, extracts their API keys, wires Prowlarr to the *arr apps, registers qBittorrent as the download client, and hands you a single dashboard to manage the lot.

## What's in the box

- **Media core**: Jellyfin, Sonarr, Radarr, Lidarr, Readarr, Bazarr, Prowlarr
- **Requests**: Jellyseerr
- **Download**: qBittorrent, SABnzbd, JDownloader2, Gluetun (VPN), FlareSolverr
- **Monitoring**: Tautulli, Jellystat (+ Postgres 15), Dozzle
- **Automation**: Unpackerr, Decluttarr, Cross-seed, Autobrr, Janitorr, Profilarr
- **Transcoding**: Tdarr (server + internal node, GPU pass-through)
- **Extras**: Kapowarr, Wizarr, Navidrome, Kavita, Audiobookshelf
- **★ JellyStack Panel**: Next.js dashboard that auto-configures everything

## Design principles

- **One install.** JellyStack is one Umbrel tile — not a cluster of 30 individual apps to install separately. You add the JellyStack community app store, install JellyStack, done.
- **Zero-config by default.** The initial wizard reads API keys out of each bundled service's config and wires Prowlarr → *arr → download clients automatically — no API-key copy-paste, no download-client setup.
- **Everything configurable from the panel.** VPN credentials, Prowlarr indexers, media paths, Jellyfin users — no `.env` editing, no terminal.
- **Unified UI.** Every bundled app is reachable from the panel's sidebar.
- **Hard-link-friendly storage.** All media and downloads live under `/home/umbrel/umbrel/JellyStack`, shared across every container — qBittorrent imports into the *arr apps are instant, no disk copy, seeding stays intact.

## Installation

> Full install guide coming soon. High-level:
>
> 1. On umbrelOS: **Settings → App Stores → Add** `https://github.com/raccommode/JellyStack`
> 2. Install the **JellyStack** app.
> 3. Open the panel and follow the welcome wizard.

## Repository layout

```
JellyStack/
├── umbrel-app-store.yml      # community app store id: "jellystack"
├── jellystack-app/           # the single Umbrel app
│   ├── umbrel-app.yml        # app manifest (id: jellystack-app)
│   ├── docker-compose.yml    # monolithic compose — boots ~30 services
│   ├── Dockerfile            # Next.js panel build
│   └── src/                  # panel source (Next.js 15, next-intl, …)
├── shared/
│   ├── env.example
│   └── docs/                 # Gluetun, GPU transcoding, …
├── scripts/                  # validators for compose & manifests
└── .github/workflows/        # CI: yamllint + validators + panel lint/typecheck
```

## Internationalization

The panel ships with **English** and **French**. Adding a new language is a 3-step process documented in [`jellystack-app/messages/README.md`](./jellystack-app/messages/README.md) — copy `en.json`, translate, register the locale.

## Contributing

Contributions are welcome. All PRs must pass:

- `python3 scripts/validate-compose.py` — services pinned to tagged images, registry consistency
- `python3 scripts/validate-manifest.py` — Umbrel manifest schema compliance
- `pnpm --dir jellystack-app typecheck` — TypeScript strict mode
- `pnpm --dir jellystack-app i18n:check` — every locale mirrors `en.json`
- `pnpm --dir jellystack-app lint` — ESLint

See [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).

## License

[MIT](./LICENSE)

---

*This README is a placeholder. It will be finalized with screenshots, demo GIF, detailed install and troubleshooting guides, and a roadmap before the v1.0.0 release.*
