/**
 * Prowlarr API v1 client. The piece that matters for JellyStack is
 * `/api/v1/applications` — it's how Prowlarr learns about Sonarr/Radarr/Lidarr
 * /Readarr and pushes indexer configs down to them.
 */

import { request } from "./base";
import type { ArrFlavor } from "./arr";

export interface ProwlarrClientOptions {
  baseUrl: string;
  apiKey: string;
}

export interface ProwlarrApplication {
  id: number;
  name: string;
  syncLevel: "disabled" | "addOnly" | "fullSync";
  implementation: string;
}

const APP_IMPLEMENTATION: Record<ArrFlavor, string> = {
  sonarr: "Sonarr",
  radarr: "Radarr",
  lidarr: "Lidarr",
  readarr: "Readarr",
};

const APP_CONFIG_CONTRACT: Record<ArrFlavor, string> = {
  sonarr: "SonarrSettings",
  radarr: "RadarrSettings",
  lidarr: "LidarrSettings",
  readarr: "ReadarrSettings",
};

export class ProwlarrClient {
  constructor(private readonly opts: ProwlarrClientOptions) {}

  private url(path: string): string {
    return `${this.opts.baseUrl.replace(/\/$/, "")}/api/v1${path}`;
  }

  private headers(): Record<string, string> {
    return { "X-Api-Key": this.opts.apiKey };
  }

  systemStatus(): Promise<{ version: string; appName: string }> {
    return request("prowlarr", this.url("/system/status"), { headers: this.headers() });
  }

  listApplications(): Promise<ProwlarrApplication[]> {
    return request("prowlarr", this.url("/applications"), { headers: this.headers() });
  }

  /**
   * Register a *arr app with Prowlarr so indexer pushes are automated.
   * Idempotent: returns the existing entry when one with the same name exists.
   */
  async ensureApplication(spec: ProwlarrAppSpec): Promise<ProwlarrApplication> {
    const existing = await this.listApplications();
    const match = existing.find((a) => a.name === spec.name);
    if (match) return match;

    return request<ProwlarrApplication>("prowlarr", this.url("/applications"), {
      method: "POST",
      headers: this.headers(),
      body: {
        syncLevel: "fullSync",
        name: spec.name,
        implementation: APP_IMPLEMENTATION[spec.flavor],
        configContract: APP_CONFIG_CONTRACT[spec.flavor],
        fields: [
          { name: "prowlarrUrl", value: spec.prowlarrUrlFromApp },
          { name: "baseUrl", value: spec.baseUrl },
          { name: "apiKey", value: spec.apiKey },
          { name: "syncCategories", value: spec.syncCategories ?? defaultCategoriesFor(spec.flavor) },
        ],
        tags: [],
      },
    });
  }
}

export interface ProwlarrAppSpec {
  name: string;               // "Sonarr" / "Radarr" / ...
  flavor: ArrFlavor;
  /** How Prowlarr reaches the *arr app, e.g. http://sonarr_server_1:8989 */
  baseUrl: string;
  /** How the *arr app reaches Prowlarr back (for RSS / manual push). */
  prowlarrUrlFromApp: string;
  apiKey: string;
  syncCategories?: number[];
}

function defaultCategoriesFor(flavor: ArrFlavor): number[] {
  // Newznab categories roughly mapped. Prowlarr exposes a UI to refine this
  // per user; our defaults cover the common case.
  switch (flavor) {
    case "sonarr":  return [5000, 5010, 5020, 5030, 5040, 5045, 5050, 5060, 5070, 5080, 5090];
    case "radarr":  return [2000, 2010, 2020, 2030, 2040, 2045, 2050, 2060, 2070, 2080];
    case "lidarr":  return [3000, 3010, 3020, 3030, 3040];
    case "readarr": return [7000, 7010, 7020, 7030, 7100, 7110, 7120];
  }
}
