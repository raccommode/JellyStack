/**
 * Helpers to discover and talk to other Umbrel apps from inside the panel.
 *
 * Umbrel injects environment variables for each declared dependency:
 *   APP_<APPID>_IP      — internal Docker IP of the app's main service
 *   APP_<APPID>_PORT    — main UI port of the app
 *
 * We can also list every installed app by scanning `/umbrel/app-data` via a
 * host-mounted volume (read-only), but for the MVP we rely on env vars.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** All apps the panel cares about (matches the JellyStack store IDs, without the `jellystack-` prefix). */
export const KNOWN_APPS = [
  "jellyfin",
  "sonarr",
  "radarr",
  "lidarr",
  "readarr",
  "bazarr",
  "prowlarr",
  "jellyseerr",
  "qbittorrent",
  "sabnzbd",
  "jdownloader",
  "gluetun",
  "tautulli",
  "jellystat",
  "dozzle",
  "unpackerr",
  "decluttarr",
  "cross-seed",
  "autobrr",
  "janitorr",
  "profilarr",
  "tdarr",
  "flaresolverr",
  "kapowarr",
  "wizarr",
  "navidrome",
  "kavita",
  "audiobookshelf",
  "portainer",
  "watchtower",
] as const;

export type KnownApp = (typeof KNOWN_APPS)[number];

export interface DetectedApp {
  id: KnownApp;
  host: string;
  port: number;
  url: string;
}

/** Canonical Umbrel env-var name for an app: `APP_<ID>_IP`, `APP_<ID>_PORT`. */
function envKey(id: KnownApp, suffix: "IP" | "PORT"): string {
  // Umbrel uppercases and replaces dashes with underscores.
  const normalized = id.toUpperCase().replace(/-/g, "_");
  return `APP_${normalized}_${suffix}`;
}

/** Returns the internal URL for an app if its env vars are present. */
export function resolveApp(id: KnownApp): DetectedApp | null {
  const host = process.env[envKey(id, "IP")];
  const port = process.env[envKey(id, "PORT")];
  if (!host || !port) return null;
  const portNum = Number.parseInt(port, 10);
  if (Number.isNaN(portNum)) return null;
  return {
    id,
    host,
    port: portNum,
    url: `http://${host}:${portNum}`,
  };
}

/** Returns the list of apps whose env vars are currently set. */
export function discoverApps(): DetectedApp[] {
  return KNOWN_APPS.map(resolveApp).filter((app): app is DetectedApp => app !== null);
}

/**
 * Reads an API key or token out of an app's config directory. Umbrel bind-mounts
 * each app's data at `${UMBREL_ROOT}/app-data/<fullId>/data/config`, and the
 * panel's docker-compose maps that tree read-only to `/umbrel-app-data`.
 *
 * @param fullId    The full Umbrel app id, e.g. `jellystack-sonarr`.
 * @param fileName  The config file to read, e.g. `config.xml`.
 */
export async function readAppConfigFile(fullId: string, fileName: string): Promise<string | null> {
  const base = process.env.UMBREL_APP_DATA_ROOT ?? "/umbrel-app-data";
  const filePath = path.join(base, fullId, "data", "config", fileName);
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/** Lists every directory name under the mounted Umbrel app-data root (⇒ installed apps). */
export async function listInstalledAppIds(): Promise<string[]> {
  const base = process.env.UMBREL_APP_DATA_ROOT ?? "/umbrel-app-data";
  try {
    const entries = await readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
