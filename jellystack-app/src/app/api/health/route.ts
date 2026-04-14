import { NextResponse } from "next/server";
import { discoverApps } from "@/lib/umbrel";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Quick TCP-style reachability check for each installed JellyStack app. Uses
 * a short fetch with AbortController so the dashboard polling never stalls.
 */
export async function GET() {
  const apps = discoverApps();

  const results = await Promise.all(
    apps.map(async (app) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(app.url, { signal: controller.signal });
        return { id: app.id, online: res.status < 500 };
      } catch {
        return { id: app.id, online: false };
      } finally {
        clearTimeout(t);
      }
    }),
  );

  return NextResponse.json({ results });
}
