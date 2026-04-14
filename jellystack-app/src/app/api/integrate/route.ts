import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverApps, resolveApp, type KnownApp } from "@/lib/umbrel";
import { discoverSecrets } from "@/lib/secrets";
import { runProwlarrToArr } from "@/lib/integration/prowlarr-to-arr";
import { runQbitToArr } from "@/lib/integration/qbit-to-arr";
import { runPaths } from "@/lib/integration/paths";
import type { ArrFlavor } from "@/lib/clients/arr";

export const dynamic = "force-dynamic";

const Body = z.object({
  recipe: z.enum(["prowlarr-to-arr", "qbit-to-arr", "paths"]),
  qbitCredentials: z
    .object({
      username: z.string(),
      password: z.string(),
    })
    .optional(),
});

const ARR_FLAVORS: ArrFlavor[] = ["sonarr", "radarr", "lidarr", "readarr"];

/**
 * POST /api/integrate
 *
 * Runs a named integration recipe and returns a per-step result list. Safe to
 * re-run: every recipe is idempotent.
 */
export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid body", detail: String(err) }, { status: 400 });
  }

  const secrets = await discoverSecrets();
  const installed = new Set(discoverApps().map((a) => a.id));

  // Build the list of *arr apps that are both installed AND have an API key.
  const arrApps = ARR_FLAVORS.flatMap((flavor) => {
    if (!installed.has(flavor as KnownApp)) return [];
    const key = secrets[flavor];
    if (!key) return [];
    const app = resolveApp(flavor as KnownApp)!;
    return [
      {
        flavor,
        name: capitalize(flavor),
        baseUrlFromPanel: app.url,
        baseUrlFromProwlarr: app.url, // same DNS inside Umbrel's network
        apiKey: key,
      },
    ];
  });

  if (payload.recipe === "prowlarr-to-arr") {
    const prowlarrApp = resolveApp("prowlarr");
    if (!prowlarrApp || !secrets.prowlarr) {
      return NextResponse.json(
        { error: "Prowlarr is not installed or its API key could not be read." },
        { status: 412 },
      );
    }
    const results = await runProwlarrToArr({
      prowlarr: {
        baseUrlFromPanel: prowlarrApp.url,
        baseUrlFromArr: prowlarrApp.url,
        apiKey: secrets.prowlarr,
      },
      arrApps,
    });
    return NextResponse.json({ results });
  }

  if (payload.recipe === "qbit-to-arr") {
    const qbitApp = resolveApp("qbittorrent");
    const sabApp = resolveApp("sabnzbd");
    if (!qbitApp && !sabApp) {
      return NextResponse.json(
        { error: "Neither qBittorrent nor SABnzbd is installed." },
        { status: 412 },
      );
    }
    const results = await runQbitToArr({
      qbit: qbitApp
        ? {
            baseUrlFromPanel: qbitApp.url,
            hostFromArr: qbitApp.host,
            portFromArr: qbitApp.port,
            username: payload.qbitCredentials?.username ?? "admin",
            password: payload.qbitCredentials?.password ?? "adminadmin",
          }
        : null,
      sabnzbd: sabApp && secrets.sabnzbd
        ? { hostFromArr: sabApp.host, portFromArr: sabApp.port, apiKey: secrets.sabnzbd }
        : null,
      arrApps: arrApps.map((a) => ({
        flavor: a.flavor,
        baseUrlFromPanel: a.baseUrlFromPanel,
        apiKey: a.apiKey,
      })),
    });
    return NextResponse.json({ results });
  }

  if (payload.recipe === "paths") {
    const results = await runPaths({
      arrApps: arrApps.map((a) => ({
        flavor: a.flavor,
        baseUrlFromPanel: a.baseUrlFromPanel,
        apiKey: a.apiKey,
      })),
    });
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "Unknown recipe" }, { status: 400 });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
