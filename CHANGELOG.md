# Changelog

All notable changes to JellyStack are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Versioning

JellyStack uses a **calendar versioning** scheme of the form
`YEAR.ISO_WEEK.INCREMENT`:

- `YEAR` — four-digit year.
- `ISO_WEEK` — ISO 8601 week number (1-53).
- `INCREMENT` — 1-based counter, reset each week.

Example: `2026.16.1` is the first release of week 16, 2026. The next release
in the same week would be `2026.16.2`; the first release of the following
week would be `2026.17.1`.

## [2026.16.1] — 2026-04-14

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

### Fixed

- Replaced `jlesage/jdownloader-2:v25.10.1` (non-existent) with `v26.03.1`.
- Replaced `lscr.io/linuxserver/readarr:develop` (empty amd64/arm64 manifest) with
  `nightly-0.1.0.978-ls12` which has working multi-arch builds.
- Fixed Janitorr image path: `ghcr.io/schaka/janitorr-jvm-stable:latest` →
  `ghcr.io/schaka/janitorr:v1.4.5`.

### Planned

- Detailed settings screens (VPN credentials UI, media path editor, user invites).
- Jellyfin token auto-read from SQLite (removing the manual token step).
- WebSocket forwarding in the reverse proxy.

[2026.16.1]: https://github.com/raccommode/JellyStack/releases/tag/2026.16.1
