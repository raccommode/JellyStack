# Routing JellyStack downloads through Mullvad via Gluetun

> Status: **placeholder** — this guide will be fleshed out during step 4 of the
> roadmap. The JellyStack Panel settings page will collect the same fields
> described below and write them for you.

## Why Gluetun

Public-tracker torrent traffic should never hit your real IP. [Gluetun](https://github.com/qdm12/gluetun)
is a small container that opens a VPN tunnel and lets other containers share
its network namespace — qBittorrent, Prowlarr, SABnzbd, Autobrr, FlareSolverr
can all be pinned to Gluetun so that if the tunnel drops, their traffic stops.

JellyStack ships Gluetun as a standalone app (`jellystack-gluetun`) rather
than bundling it with qBittorrent so it stays composable with the rest of the
ecosystem.

## What you need from Mullvad

1. An active Mullvad account number.
2. A WireGuard config generated at <https://mullvad.net/en/account/wireguard-config>:
   pick a server, download the `.conf`, extract:
   - `PrivateKey` → `WIREGUARD_PRIVATE_KEY`
   - `Address`    → `WIREGUARD_ADDRESSES` (e.g. `10.66.77.88/32`)
   - `Endpoint`   → the city matches `SERVER_CITIES` (e.g. `Amsterdam`)

## Setting the values

**Recommended (no terminal):** once JellyStack Panel is installed, open
*Settings → VPN* and paste the Mullvad values into the form. The panel writes
them to Gluetun's config directory and restarts the container.

**Manual:** copy `shared/env.example` to `.env`, uncomment the `VPN_*`
variables, and fill them in before starting `jellystack-gluetun`.

## Verifying the tunnel

From inside Gluetun:

```bash
docker exec jellystack-gluetun_server_1 wget -qO- https://am.i.mullvad.net/connected
# => You are connected to Mullvad (server ch-zrh-wg-001). ...
```

From qBittorrent: the external IP shown in *Tools → Options → Connection →
Network interface* should match the Mullvad exit IP, not your ISP's.

## Port forwarding

Mullvad no longer offers port forwarding. Expect lower ratios on private
trackers but still-fine public-tracker seeding. If port forwarding is
non-negotiable, Gluetun supports ProtonVPN, PIA and AirVPN — the JellyStack
Panel form has a provider dropdown for those.
