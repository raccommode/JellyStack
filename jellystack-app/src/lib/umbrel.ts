/**
 * Thin backwards-compatible wrapper over the new `services` registry.
 *
 * Historically we read sibling apps from Umbrel's injected env vars
 * (`APP_SONARR_IP` / `APP_SONARR_PORT`). JellyStack is now a monolithic
 * Umbrel app, so every sibling lives in the same compose project and is
 * reachable by its Docker service name. We keep this module as the public
 * seam so API routes don't have to know which mode we're in.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SERVICES, internalUrl, type ServiceDef, type ServiceId } from "./services";

export type KnownApp = ServiceId;
export const KNOWN_APPS: readonly ServiceId[] = SERVICES.map((s) => s.id);

export interface DetectedApp {
  id: ServiceId;
  host: string;
  port: number;
  url: string;
}

/** Returns every service the panel is willing to talk to. */
export function discoverApps(): DetectedApp[] {
  return SERVICES.map(toDetected);
}

export function resolveApp(id: ServiceId): DetectedApp | null {
  const svc = SERVICES.find((s) => s.id === id);
  return svc ? toDetected(svc) : null;
}

function toDetected(svc: ServiceDef): DetectedApp {
  return {
    id: svc.id,
    host: svc.id, // Docker DNS: service name == hostname
    port: svc.port,
    url: internalUrl(svc),
  };
}

/**
 * Reads a config file from a sibling service's data directory. The panel's
 * compose declaration mounts `${APP_DATA_DIR}/data` read-only at `/apps-data`,
 * so Sonarr's `config.xml` lives at `/apps-data/sonarr/config/config.xml`.
 */
export async function readAppConfigFile(
  id: ServiceId,
  relative: string,
): Promise<string | null> {
  const base = process.env.JELLYSTACK_APPS_DATA_ROOT ?? "/apps-data";
  const filePath = path.join(base, id, "config", relative);
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/** Lists each sibling service whose config directory exists on disk. */
export async function listInstalledAppIds(): Promise<string[]> {
  const base = process.env.JELLYSTACK_APPS_DATA_ROOT ?? "/apps-data";
  try {
    const entries = await readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
