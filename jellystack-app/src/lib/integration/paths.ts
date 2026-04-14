/**
 * Recipe: ensure each *arr app has its canonical root folder registered.
 * The volume layout is defined in `/data/media/...` inside every container
 * because every JellyStack app mounts `${JELLYSTACK_ROOT}:/data`.
 */

import { ArrClient, type ArrFlavor } from "../clients/arr";
import { ApiError } from "../clients/base";
import type { RecipeStepResult } from "./prowlarr-to-arr";

export interface PathsInput {
  arrApps: Array<{
    flavor: ArrFlavor;
    baseUrlFromPanel: string;
    apiKey: string;
  }>;
}

const ROOT_FOLDER_FOR: Record<ArrFlavor, string> = {
  sonarr:  "/data/media/tv",
  radarr:  "/data/media/movies",
  lidarr:  "/data/media/music",
  readarr: "/data/media/books",
};

export async function runPaths(input: PathsInput): Promise<RecipeStepResult[]> {
  const results: RecipeStepResult[] = [];

  for (const arr of input.arrApps) {
    const client = new ArrClient({
      flavor: arr.flavor,
      baseUrl: arr.baseUrlFromPanel,
      apiKey: arr.apiKey,
    });
    const root = ROOT_FOLDER_FOR[arr.flavor];

    try {
      await client.ensureRootFolder(root);
      results.push({ step: `${arr.flavor}.rootFolder`, ok: true });
    } catch (err) {
      results.push({ step: `${arr.flavor}.rootFolder`, ok: false, message: errMsg(err) });
    }
  }

  return results;
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : String(err);
}
