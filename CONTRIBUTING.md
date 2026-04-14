# Contributing to JellyStack

Thanks for wanting to help. JellyStack is opinionated about being easy to install, but friendly to contribute to. This guide will get you productive in a few minutes.

## Quick orientation

The repo contains **one Umbrel community app store** shipping **one Umbrel app** (the JellyStack bundle). Everything the panel knows about the stack lives in two files:

- `jellystack-app/docker-compose.yml` — every bundled service (Jellyfin, Sonarr, qBittorrent, …)
- `jellystack-app/src/lib/services.ts` — the registry the panel reads at runtime

CI cross-checks these two: if a service is in the registry but missing from compose (or vice versa), the build fails.

## Setup

```bash
# Panel (Next.js, TypeScript, next-intl, Tailwind)
pnpm --dir jellystack-app install
pnpm --dir jellystack-app dev            # http://localhost:3000

# Validators (Python, yaml)
python3 scripts/validate-compose.py
python3 scripts/validate-manifest.py
```

You need:

- Node.js **22+**
- pnpm **10+**
- Python **3.12+** (only to run validators)
- Docker (only when testing the compose end-to-end)

## Tasks you'll hit often

### Add a new service to the stack

1. Add the service to `jellystack-app/docker-compose.yml` with a pinned image tag and volumes that use `${APP_DATA_DIR}/data/<id>/config` and, if relevant, `${JELLYSTACK_ROOT:-${UMBREL_ROOT}/JellyStack}:/data`.
2. Add a matching entry to `jellystack-app/src/lib/services.ts` (the `SERVICES` array) — give it an id, label, category, port, and iframe-ability.
3. If the service has an API the panel should auto-configure, add a client under `jellystack-app/src/lib/clients/` and a recipe under `jellystack-app/src/lib/integration/`.
4. Run the validators and the panel lint/typecheck — CI will run them too.

### Add a translation

See [`jellystack-app/messages/README.md`](./jellystack-app/messages/README.md). Three-step process: copy `en.json`, translate, register the locale code.

### Fix a wiring bug

The integration recipes live in `jellystack-app/src/lib/integration/*`. They're designed to be idempotent — running a recipe twice is a no-op after the first successful run. Keep that invariant when you touch them.

## Pull request checklist

Before opening a PR, run:

```bash
pnpm --dir jellystack-app typecheck
pnpm --dir jellystack-app i18n:check
pnpm --dir jellystack-app lint
python3 scripts/validate-compose.py
python3 scripts/validate-manifest.py
```

Everything above runs in CI on every PR. If it's green locally, it'll be green on GitHub.

A few conventions:

- **Language:** code, comments, commit messages, PR titles, issue descriptions — all in English. The panel UI is i18n; its source language is English.
- **Commit style:** short imperative subject (`feat: add SABnzbd auto-config`). No trailing period.
- **Image tags:** pin to a specific version (`lscr.io/linuxserver/sonarr:4.0.15`). Never `:latest`. Digest pinning (`@sha256:…`) on final release PRs.
- **No `docker compose config` in CI:** it rejects Umbrel's injected `app_proxy` service. Use the Python validator instead.
- **No dependencies in the Umbrel manifest:** JellyStack is monolithic, `dependencies:` must be `[]`.

## Questions?

Open an issue — questions, bug reports, and feature requests all welcome.
