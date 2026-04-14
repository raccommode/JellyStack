import { NextResponse } from "next/server";
import { discoverApps, listInstalledAppIds } from "@/lib/umbrel";

export const dynamic = "force-dynamic";

/**
 * GET /api/discover
 *
 * Returns every JellyStack app the panel can currently reach via Umbrel's
 * injected env vars, plus the raw list of app-data directories mounted into
 * the container (⇒ apps installed on this Umbrel instance, even if the panel
 * does not have them as explicit `dependencies`).
 */
export async function GET() {
  const apps = discoverApps();
  const installedIds = await listInstalledAppIds();

  return NextResponse.json({
    count: apps.length,
    apps,
    installedIds,
  });
}
