/**
 * Reverse proxy for bundled JellyStack services.
 *
 * Why this exists: JellyStack runs every service on the compose's private
 * bridge network (http://sonarr:8989, http://radarr:7878, …). Those hostnames
 * are only resolvable from inside the containers — the user's browser cannot
 * reach them directly. The panel is the only thing exposed via Umbrel's
 * app_proxy, so we proxy every service request through ourselves.
 *
 * Behavior:
 *   /proxy/sonarr             → http://sonarr:8989/
 *   /proxy/sonarr/foo/bar     → http://sonarr:8989/foo/bar
 *   /proxy/radarr/api/v3/...  → http://radarr:7878/api/v3/...
 *
 * Limitations (to tighten later):
 *   - No WebSocket upgrade. Apps that depend on WS for live updates
 *     (Jellyfin, Jellystat) will fall back to polling or degrade gracefully.
 *   - No HTML rewriting. Apps that emit absolute URLs in their markup
 *     (`<link href="/css/app.css">` would hit the panel instead of the app).
 *     The *arr suite, qBittorrent, Tautulli use relative paths so they work
 *     out of the box; Jellyfin needs its own tweak (the Jellyfin dashboard
 *     lets users set a BaseURL which makes it relative).
 */

import type { NextRequest } from "next/server";
import { getService, internalUrl, type ServiceId } from "@/lib/services";

// Next.js catch-all wildcard `[[...path]]` passes through these as strings.
interface RouteContext {
  params: Promise<{ service: string; path?: string[] }>;
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function isKnownService(id: string): id is ServiceId {
  try {
    getService(id as ServiceId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rewrite absolute Location: values so the browser follows them back through
 * the panel instead of falling off the /proxy/<service> namespace.
 *
 *   /web/index.html            → /proxy/<service>/web/index.html
 *   http://jellyfin:8096/foo   → /proxy/<service>/foo   (same upstream origin)
 *   https://external.example/x → kept as-is (cross-origin redirect)
 *
 * Relative Locations (without leading slash) are passed through unchanged —
 * the browser resolves them relative to the current request URL which
 * already sits under /proxy/<service>/.
 */
function rewriteLocation(location: string, service: string): string {
  if (!location) return location;
  const prefix = `/proxy/${service}`;
  if (location.startsWith(`${prefix}/`)) return location;

  // Absolute URL: only rewrite when it points at the upstream we just proxied.
  if (/^https?:\/\//i.test(location)) {
    try {
      const url = new URL(location);
      if (url.hostname === service) {
        return `${prefix}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Malformed URL — leave it alone.
    }
    return location;
  }

  // Absolute path from the upstream's root.
  if (location.startsWith("/")) {
    return `${prefix}${location}`;
  }

  return location;
}

async function proxy(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const { service, path } = await ctx.params;

  if (!isKnownService(service)) {
    return new Response(`Unknown JellyStack service: ${service}`, { status: 404 });
  }

  const svc = getService(service);
  const base = internalUrl(svc).replace(/\/$/, "");
  const rest = (path ?? []).join("/");
  const search = req.nextUrl.search;
  const target = `${base}/${rest}${search}`;

  // Forward headers, stripping hop-by-hop ones.
  const forwardedHeaders = new Headers();
  for (const [k, v] of req.headers) {
    if (!HOP_BY_HOP_HEADERS.has(k.toLowerCase())) {
      forwardedHeaders.set(k, v);
    }
  }
  // Tell the app what its user-visible base path is so it can emit correct
  // redirects back to the browser.
  forwardedHeaders.set("X-Forwarded-Proto", req.nextUrl.protocol.replace(":", ""));
  forwardedHeaders.set("X-Forwarded-Host", req.headers.get("host") ?? "");
  forwardedHeaders.set("X-Forwarded-Prefix", `/proxy/${service}`);

  const init: RequestInit = {
    method: req.method,
    headers: forwardedHeaders,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Bad gateway reaching ${service}: ${message}`, { status: 502 });
  }

  // Copy response headers, stripping the ones that would block iframe embedding
  // back into the panel (we are on the same origin, so CSP/X-Frame-Options
  // restrictions from the upstream app are not meaningful — they were written
  // for standalone deployments). Also rewrite `Location:` on redirects so that
  // absolute paths emitted by the upstream (e.g. Jellyfin's `302 -> /web/`)
  // stay inside our `/proxy/<service>` namespace instead of escaping to the
  // panel's own routes (where they'd 404).
  const responseHeaders = new Headers();
  for (const [k, v] of upstream.headers) {
    const lower = k.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    if (lower === "x-frame-options") continue;
    if (lower === "content-security-policy") continue;
    if (lower === "location") {
      responseHeaders.append(k, rewriteLocation(v, service));
      continue;
    }
    responseHeaders.append(k, v);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: RouteContext)     { return proxy(req, ctx); }
export async function POST(req: NextRequest, ctx: RouteContext)    { return proxy(req, ctx); }
export async function PUT(req: NextRequest, ctx: RouteContext)     { return proxy(req, ctx); }
export async function PATCH(req: NextRequest, ctx: RouteContext)   { return proxy(req, ctx); }
export async function DELETE(req: NextRequest, ctx: RouteContext)  { return proxy(req, ctx); }
export async function HEAD(req: NextRequest, ctx: RouteContext)    { return proxy(req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: RouteContext) { return proxy(req, ctx); }
