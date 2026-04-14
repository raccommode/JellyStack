import { NextResponse } from "next/server";
import { discoverSecrets } from "@/lib/secrets";

export const dynamic = "force-dynamic";

/**
 * GET /api/secrets
 *
 * Returns which API keys the panel was able to auto-extract from the apps'
 * config directories. The wizard uses this to skip "paste your API key" steps.
 *
 * Presence of a key is reported as a boolean `found` to avoid leaking the
 * actual value over HTTP. Callers that need the key itself stay server-side.
 */
export async function GET() {
  const secrets = await discoverSecrets();
  return NextResponse.json({
    sonarr:   { found: !!secrets.sonarr },
    radarr:   { found: !!secrets.radarr },
    lidarr:   { found: !!secrets.lidarr },
    readarr:  { found: !!secrets.readarr },
    prowlarr: { found: !!secrets.prowlarr },
    sabnzbd:  { found: !!secrets.sabnzbd },
    jellyfin: { found: !!secrets.jellyfin },
  });
}
