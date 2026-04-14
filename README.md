# JellyStack

> The complete Jellyfin media stack, delivered as an Umbrel Community App Store.

**Status: under active development — not yet ready for general use.**

JellyStack bundles ~32 apps (Jellyfin, the *arr suite, download clients, monitoring, and more) into a single Umbrel community app store, fronted by a custom Next.js panel that detects installed apps, wires them together automatically, and exposes them through a unified UI.

## What's in the box

- **Media core**: Jellyfin, Sonarr, Radarr, Lidarr, Readarr, Bazarr, Prowlarr
- **Requests**: Jellyseerr
- **Download**: qBittorrent, SABnzbd, JDownloader2, Gluetun (VPN)
- **Monitoring**: Tautulli, Jellystat, Dozzle
- **Automation**: Unpackerr, Decluttarr, Cross-seed, Autobrr, Janitorr, Profilarr, Tdarr
- **Extras**: FlareSolverr, Kapowarr, Wizarr, Navidrome, Kavita, Audiobookshelf
- **Management**: Portainer, Watchtower
- **★ JellyStack Panel**: a custom Next.js dashboard that auto-configures the whole stack

## Design principles

- **Zero-config by default.** The initial wizard reads API keys from each app's config and wires Prowlarr → *arr → download clients automatically.
- **Everything configurable from the panel.** VPN credentials, indexers, paths, users — no `.env` editing, no terminal.
- **Unified UI.** Every app accessible through an iframe inside the panel; one sidebar to rule them all.
- **Hard-link-friendly storage.** All media lives under `/home/umbrel/umbrel/JellyStack`, shared across every container.

## Installation

> Full install guide coming soon. High-level:
>
> 1. On umbrelOS: **Settings → App Stores → Add** `https://github.com/raccommode/JellyStack`
> 2. Install the **JellyStack Panel** app.
> 3. Open the panel and follow the welcome wizard.

## Internationalization

The panel ships with **English** and **French** translations. Adding a new language is a 3-step process documented in [`jellystack-panel/messages/README.md`](./jellystack-panel/messages/README.md) — copy `en.json`, translate, register the locale.

## License

[MIT](./LICENSE)

---

*This README is a placeholder. It will be finalized (screenshots, demo GIF, detailed install guide, contributing guide, roadmap) before the v1.0.0 release.*
