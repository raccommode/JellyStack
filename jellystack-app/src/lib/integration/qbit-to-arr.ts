/**
 * Recipe: register qBittorrent (and optionally SABnzbd) as download client on
 * every installed *arr app, pre-creating the qBit categories that match each
 * *arr's media kind.
 */

import { ArrClient, type ArrFlavor } from "../clients/arr";
import { QBittorrentClient } from "../clients/qbittorrent";
import { ApiError } from "../clients/base";
import type { RecipeStepResult } from "./prowlarr-to-arr";

export interface QbitToArrInput {
  qbit: {
    baseUrlFromPanel: string;   // http://jellystack-qbittorrent_server_1:8080
    hostFromArr: string;        // jellystack-qbittorrent_server_1
    portFromArr: number;        // 8080
    username: string;
    password: string;
  } | null;
  sabnzbd?: {
    hostFromArr: string;
    portFromArr: number;
    apiKey: string;
  } | null;
  arrApps: Array<{
    flavor: ArrFlavor;
    baseUrlFromPanel: string;
    apiKey: string;
  }>;
}

const CATEGORY_FOR: Record<ArrFlavor, string> = {
  sonarr: "tv",
  radarr: "movies",
  lidarr: "music",
  readarr: "books",
};

const SAVE_PATH_FOR: Record<ArrFlavor, string> = {
  // qBit sees the shared root at /data inside its container.
  sonarr:  "/data/downloads/torrents/tv",
  radarr:  "/data/downloads/torrents/movies",
  lidarr:  "/data/downloads/torrents/music",
  readarr: "/data/downloads/torrents/books",
};

export async function runQbitToArr(input: QbitToArrInput): Promise<RecipeStepResult[]> {
  const results: RecipeStepResult[] = [];

  // 1) Pre-create qBit categories so each *arr's files land in its own folder.
  if (input.qbit) {
    const qbit = new QBittorrentClient({
      baseUrl: input.qbit.baseUrlFromPanel,
      username: input.qbit.username,
      password: input.qbit.password,
    });

    try {
      await qbit.version();
      results.push({ step: "qbit.ping", ok: true });
    } catch (err) {
      results.push({ step: "qbit.ping", ok: false, message: errMsg(err) });
      // Keep going for SABnzbd config even if qBit is unreachable.
    }

    for (const arr of input.arrApps) {
      const category = CATEGORY_FOR[arr.flavor];
      const savePath = SAVE_PATH_FOR[arr.flavor];
      try {
        await qbit.ensureCategory(category, savePath);
        results.push({ step: `qbit.category.${category}`, ok: true });
      } catch (err) {
        results.push({ step: `qbit.category.${category}`, ok: false, message: errMsg(err) });
      }
    }
  }

  // 2) Add download clients to each *arr.
  for (const arr of input.arrApps) {
    const client = new ArrClient({
      flavor: arr.flavor,
      baseUrl: arr.baseUrlFromPanel,
      apiKey: arr.apiKey,
    });

    if (input.qbit) {
      try {
        await client.ensureDownloadClient({
          kind: "qbittorrent",
          name: "qBittorrent",
          host: input.qbit.hostFromArr,
          port: input.qbit.portFromArr,
          username: input.qbit.username,
          password: input.qbit.password,
          category: CATEGORY_FOR[arr.flavor],
        });
        results.push({ step: `${arr.flavor}.dlclient.qbit`, ok: true });
      } catch (err) {
        results.push({ step: `${arr.flavor}.dlclient.qbit`, ok: false, message: errMsg(err) });
      }
    }

    if (input.sabnzbd) {
      try {
        await client.ensureDownloadClient({
          kind: "sabnzbd",
          name: "SABnzbd",
          host: input.sabnzbd.hostFromArr,
          port: input.sabnzbd.portFromArr,
          apiKey: input.sabnzbd.apiKey,
          category: CATEGORY_FOR[arr.flavor],
        });
        results.push({ step: `${arr.flavor}.dlclient.sab`, ok: true });
      } catch (err) {
        results.push({ step: `${arr.flavor}.dlclient.sab`, ok: false, message: errMsg(err) });
      }
    }
  }

  return results;
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : String(err);
}
