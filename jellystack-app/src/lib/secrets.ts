/**
 * Read API keys and tokens from each sibling service's config tree.
 *
 * JellyStack runs as a monolithic Umbrel app: every bundled service writes
 * its config under `${APP_DATA_DIR}/data/<service>/config/…`, and the panel's
 * compose binds `${APP_DATA_DIR}/data` read-only to `/apps-data`. From the
 * panel's point of view, Sonarr's `config.xml` lives at
 * `/apps-data/sonarr/config/config.xml`.
 *
 * All functions return `null` on failure — the panel treats missing secrets
 * as "not yet configured", not as an error to surface.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.JELLYSTACK_APPS_DATA_ROOT ?? "/apps-data";

/** Relative path of each service's key config file, from its own config dir. */
const CONFIG_PATHS = {
  sonarr:    "config.xml",
  radarr:    "config.xml",
  lidarr:    "config.xml",
  readarr:   "config.xml",
  prowlarr:  "config.xml",
  bazarr:    "config/config.yaml",
  jellyfin:  "root/default/system.xml",
  sabnzbd:   "sabnzbd.ini",
} as const;

type Service = keyof typeof CONFIG_PATHS;

async function readConfigFile(service: Service): Promise<string | null> {
  try {
    return await readFile(path.join(BASE, service, "config", CONFIG_PATHS[service]), "utf8");
  } catch {
    return null;
  }
}

/**
 * The *arr suite all write their API key inside a `<Config><ApiKey>…</ApiKey>`
 * element in `config.xml`. Regex is deliberately forgiving.
 */
function extractArrApiKey(xml: string): string | null {
  const match = /<ApiKey>([a-f0-9]{32,})<\/ApiKey>/i.exec(xml);
  return match?.[1] ?? null;
}

export async function readArrApiKey(service: Service): Promise<string | null> {
  const xml = await readConfigFile(service);
  if (!xml) return null;
  return extractArrApiKey(xml);
}

/** SABnzbd writes its API key in `sabnzbd.ini` under `api_key = …`. */
export async function readSabnzbdApiKey(): Promise<string | null> {
  const ini = await readConfigFile("sabnzbd");
  if (!ini) return null;
  const match = /^\s*api_key\s*=\s*([a-f0-9]+)\s*$/im.exec(ini);
  return match?.[1] ?? null;
}

/**
 * Jellyfin doesn't write API keys into a file by default — the admin has to
 * generate one from the UI. The wizard step prompts for it and stores it in
 * the panel's own data dir.
 */
export async function readJellyfinToken(): Promise<string | null> {
  // Reserved for a future enhancement (SQLite read with better-sqlite3).
  return null;
}

export interface DiscoveredSecrets {
  sonarr: string | null;
  radarr: string | null;
  lidarr: string | null;
  readarr: string | null;
  prowlarr: string | null;
  sabnzbd: string | null;
  jellyfin: string | null;
}

/** Loads every secret we can auto-detect in parallel. */
export async function discoverSecrets(): Promise<DiscoveredSecrets> {
  const [sonarr, radarr, lidarr, readarr, prowlarr, sabnzbd, jellyfin] = await Promise.all([
    readArrApiKey("sonarr"),
    readArrApiKey("radarr"),
    readArrApiKey("lidarr"),
    readArrApiKey("readarr"),
    readArrApiKey("prowlarr"),
    readSabnzbdApiKey(),
    readJellyfinToken(),
  ]);
  return { sonarr, radarr, lidarr, readarr, prowlarr, sabnzbd, jellyfin };
}
