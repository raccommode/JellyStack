/**
 * Recipe: register every installed *arr app with Prowlarr so Prowlarr can
 * push indexers and RSS feeds to them automatically.
 *
 * All steps are idempotent — running this recipe twice is a no-op after the
 * first successful run.
 */

import { ArrClient, type ArrFlavor } from "../clients/arr";
import { ProwlarrClient } from "../clients/prowlarr";
import { ApiError } from "../clients/base";

export interface ProwlarrToArrInput {
  prowlarr: {
    baseUrlFromPanel: string;   // http://jellystack-prowlarr_server_1:9696
    baseUrlFromArr: string;     // same, but that's the URL each *arr uses
    apiKey: string;
  };
  arrApps: Array<{
    flavor: ArrFlavor;
    name: string;               // "Sonarr" | "Radarr" | ...
    baseUrlFromPanel: string;   // http://jellystack-sonarr_server_1:8989
    baseUrlFromProwlarr: string;
    apiKey: string;
  }>;
}

export interface RecipeStepResult {
  step: string;
  ok: boolean;
  message?: string;
}

export async function runProwlarrToArr(input: ProwlarrToArrInput): Promise<RecipeStepResult[]> {
  const results: RecipeStepResult[] = [];
  const prowlarr = new ProwlarrClient({
    baseUrl: input.prowlarr.baseUrlFromPanel,
    apiKey: input.prowlarr.apiKey,
  });

  // Sanity-check Prowlarr before we start wiring anything.
  try {
    await prowlarr.systemStatus();
    results.push({ step: "prowlarr.ping", ok: true });
  } catch (err) {
    results.push({ step: "prowlarr.ping", ok: false, message: errMsg(err) });
    return results; // no point continuing if Prowlarr is down
  }

  for (const arr of input.arrApps) {
    // Also ping the *arr to surface a meaningful error early.
    try {
      const client = new ArrClient({
        flavor: arr.flavor,
        baseUrl: arr.baseUrlFromPanel,
        apiKey: arr.apiKey,
      });
      await client.systemStatus();
      results.push({ step: `${arr.flavor}.ping`, ok: true });
    } catch (err) {
      results.push({ step: `${arr.flavor}.ping`, ok: false, message: errMsg(err) });
      continue;
    }

    try {
      await prowlarr.ensureApplication({
        name: arr.name,
        flavor: arr.flavor,
        baseUrl: arr.baseUrlFromProwlarr,
        prowlarrUrlFromApp: input.prowlarr.baseUrlFromArr,
        apiKey: arr.apiKey,
      });
      results.push({ step: `prowlarr.register.${arr.flavor}`, ok: true });
    } catch (err) {
      results.push({
        step: `prowlarr.register.${arr.flavor}`,
        ok: false,
        message: errMsg(err),
      });
    }
  }

  return results;
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : String(err);
}
