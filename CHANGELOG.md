# Changelog

All notable changes to JellyStack are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and JellyStack
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Monolithic Umbrel app: installing JellyStack brings up the full media
  stack in one click (~30 services).
- JellyStack panel: Next.js 15 + React 19, English and French
  translations via `next-intl`, persistent sidebar grouped by category.
- Setup wizard with 6 steps that auto-wire Prowlarr ↔ *arr ↔ qBittorrent/SABnzbd.
- Reverse proxy at `/proxy/[service]/*` so the user's browser can reach
  services that live on the compose's private bridge network.
- Iframe viewer at `/[locale]/apps/[id]` for every bundled service.
- Live dashboard that polls `/api/health` every 30 seconds.
- Python validators (`validate-compose.py`, `validate-manifest.py`) enforced in CI.
- i18n key-diff check (`pnpm i18n:check`) enforced in CI.

### Planned

- Detailed settings screens (VPN credentials UI, media path editor, user invites).
- Jellyfin token auto-read from SQLite (removing the manual token step).
- WebSocket forwarding in the reverse proxy.
- Published `ghcr.io/raccommode/jellystack-panel` image.

[Unreleased]: https://github.com/raccommode/JellyStack/commits/main
