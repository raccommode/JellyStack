# Hardware transcoding for Jellyfin and Tdarr

> Status: **placeholder** — this guide will be expanded when the Jellyfin and
> Tdarr manifests land in step 3 of the roadmap.

Jellyfin can transcode incompatible streams in real time, and Tdarr can
re-encode your library in bulk. Both burn a lot of CPU unless you give them a
GPU. umbrelOS runs on a few common targets — here's the short version per
target.

## Intel QuickSync (most mini-PCs, NUCs, N100 boxes)

- Confirm the device exists on the host: `ls /dev/dri` should show `card0` and
  `renderD128`.
- JellyStack manifests mount `/dev/dri` into the containers and add the
  `render` group so that `jellyfin`'s internal `abc` user can access it.
- In Jellyfin: *Dashboard → Playback → Hardware acceleration → Intel QuickSync*.

## NVIDIA

- Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
  on the host.
- JellyStack manifests for `jellyfin` and `tdarr` will include a
  `deploy.resources.reservations.devices` block gated on a `PROFILE_NVIDIA`
  docker compose profile so non-NVIDIA installs aren't broken.
- In Jellyfin: *Dashboard → Playback → Hardware acceleration → NVENC*.

## Apple Silicon / macOS (development only)

Docker Desktop on macOS does not expose the GPU to Linux containers — Jellyfin
will fall back to CPU transcoding. Use this setup only for dev, not for a
serious media box.

## Tdarr

Tdarr has a separate worker node container that does the heavy lifting.
JellyStack ships `jellystack-tdarr` (server + internal node) out of the box,
and exposes the node env vars so you can scale out with extra workers later.
