# JellyStack architecture

This document is for maintainers. End users can safely skip it.

## Why one app, not many

Earlier iterations of JellyStack shipped as a community app store with 30
individual Umbrel apps (one per service). It was flexible but painful:
users installed them one by one and then spent 20 minutes copy-pasting API
keys between tabs. JellyStack is now a **single monolithic Umbrel app** —
one install boots the whole stack, the panel wires everything via API.

The trade-off is explicit: you can't install "just Jellyfin" from
JellyStack. If that's what you want, use Umbrel's official Jellyfin app.

## Compose project layout

```
jellystack-app/
├── umbrel-app.yml           # Manifest the App Store renders (one tile)
└── docker-compose.yml       # ~30 services in one project
```

When umbrelOS starts the app, Compose creates a default bridge network
named `jellystack-app_default`. Every service joins it and can resolve
every other service by name:

```
http://sonarr:8989       ✓ works from any container in the project
http://prowlarr:9696     ✓ works from any container in the project
http://sonarr.umbrel.local  ✗ does NOT work — Umbrel's DNS is per-app
```

The panel container is the only one exposed to the outside world, through
Umbrel's `app_proxy` sidecar (which handles auth and routes traffic on
the app's advertised port). Browsers never reach the other services
directly — they go through the panel's reverse proxy.

## The reverse proxy

`jellystack-app/src/app/proxy/[service]/[[...path]]/route.ts` is a
catch-all Next.js route that takes any incoming request and forwards it
to the matching Docker DNS name.

```
GET  /proxy/sonarr/              → http://sonarr:8989/
POST /proxy/prowlarr/api/v1/foo  → http://prowlarr:9696/api/v1/foo
```

What the proxy does:

- Forwards all HTTP verbs, headers (minus hop-by-hop) and bodies.
- Strips upstream `X-Frame-Options` and `Content-Security-Policy` so the
  iframe viewer in `/apps/[id]` can embed the response without breakage.
- Sets `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Prefix`
  (`/proxy/<service>`) so apps emit correct redirects.

What it does **not** do (yet):

- WebSocket upgrades. Jellyfin's live playback dashboard, for instance,
  falls back to long-poll when iframed. Good-enough for v1, planned for
  later.
- HTML rewriting. If an upstream app emits absolute URLs in its HTML,
  they'll 404 through the panel. The *arr suite, qBittorrent, Tautulli
  and SABnzbd all use relative URLs and work out of the box. Jellyfin
  needs its internal `BaseURL` field set to `/proxy/jellyfin` if the
  user wants full iframe support.

## Storage

```
/home/umbrel/umbrel/JellyStack     ← set in shared/env.example
  ├── downloads/
  │   ├── torrents/{movies,tv,music,books}
  │   ├── usenet/
  │   └── direct/
  └── media/
      ├── movies/   tv/   music/   books/   audiobooks/   comics/
```

Every service mounts this root as `/data`. That's the whole point — qBit
writes to `/data/downloads/torrents/tv`, Sonarr reads from the same
absolute path, and Sonarr's "move to library" step uses **hard links**
(instant, zero-copy, keeps the torrent seeding). If the two lived on
different mounts, every import would be a full file copy.

## Secrets

Each bundled service stores its own config under
`${APP_DATA_DIR}/data/<service>/config`. The panel's compose declaration
binds that tree read-only at `/apps-data`, so we can parse Sonarr's
`config.xml`, Prowlarr's `config.xml`, SABnzbd's `sabnzbd.ini` etc. to
extract API keys without asking the user. See
`jellystack-app/src/lib/secrets.ts`.

Jellyfin is the one exception — its API keys live in a SQLite database
that is harder to parse safely. The wizard prompts the user to generate
a key in the Jellyfin Dashboard and paste it once.

## The panel's service registry

`jellystack-app/src/lib/services.ts` is the **single source of truth**
for "what services exist, what category they belong to, what port they
listen on, whether they iframe". The sidebar, the dashboard grid, the
iframe viewer, the health poller and the wizard all consume it.

CI cross-checks this file against `docker-compose.yml`: adding a service
to the registry without declaring it in compose (or the reverse) fails
the build. This is the invariant that keeps the two from drifting.

## CI

`.github/workflows/lint.yml` runs three jobs on every push/PR:

1. **yaml** — yamllint on every `*.yml` in the repo.
2. **compose** — Python validators. `validate-compose.py` enforces
   pinned image tags, the registry/compose sync, and Umbrel `app_proxy`
   conventions. `validate-manifest.py` enforces the Umbrel manifest schema.
3. **panel** — pnpm install, `i18n:check`, TypeScript, ESLint.
