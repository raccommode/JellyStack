/**
 * Generic client for the *arr family (Sonarr, Radarr, Lidarr, Readarr) — they
 * all share the same v3 REST API shape, so we parameterize on `baseUrl` +
 * `apiKey` instead of duplicating four almost-identical clients.
 */

import { request } from "./base";

export type ArrFlavor = "sonarr" | "radarr" | "lidarr" | "readarr";

export interface ArrClientOptions {
  flavor: ArrFlavor;
  baseUrl: string;   // e.g. "http://sonarr_server_1:8989"
  apiKey: string;
}

export interface ArrSystemStatus {
  version: string;
  appName: string;
  instanceName?: string;
  branch?: string;
}

export interface ArrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace?: number;
}

export interface ArrDownloadClient {
  id: number;
  name: string;
  implementation: string;
  enable: boolean;
}

export interface ArrIndexer {
  id: number;
  name: string;
  implementation: string;
  enable: boolean;
}

export class ArrClient {
  constructor(private readonly opts: ArrClientOptions) {}

  private url(path: string): string {
    return `${this.opts.baseUrl.replace(/\/$/, "")}/api/v3${path}`;
  }

  private headers(): Record<string, string> {
    return { "X-Api-Key": this.opts.apiKey };
  }

  systemStatus(): Promise<ArrSystemStatus> {
    return request(this.opts.flavor, this.url("/system/status"), { headers: this.headers() });
  }

  listRootFolders(): Promise<ArrRootFolder[]> {
    return request(this.opts.flavor, this.url("/rootfolder"), { headers: this.headers() });
  }

  /** Add a root folder if absent. Idempotent — returns the existing one if already present. */
  async ensureRootFolder(path: string): Promise<ArrRootFolder> {
    const existing = await this.listRootFolders();
    const match = existing.find((f) => f.path.replace(/\/$/, "") === path.replace(/\/$/, ""));
    if (match) return match;
    return request<ArrRootFolder>(this.opts.flavor, this.url("/rootfolder"), {
      method: "POST",
      headers: this.headers(),
      body: { path },
    });
  }

  listDownloadClients(): Promise<ArrDownloadClient[]> {
    return request(this.opts.flavor, this.url("/downloadclient"), { headers: this.headers() });
  }

  /** Idempotent. Returns existing client if one with the same name is already registered. */
  async ensureDownloadClient(spec: QBitDownloadClientSpec | SabDownloadClientSpec): Promise<ArrDownloadClient> {
    const existing = await this.listDownloadClients();
    const match = existing.find((c) => c.name === spec.name);
    if (match) return match;
    return request<ArrDownloadClient>(this.opts.flavor, this.url("/downloadclient"), {
      method: "POST",
      headers: this.headers(),
      body: buildDownloadClientPayload(spec),
    });
  }

  listIndexers(): Promise<ArrIndexer[]> {
    return request(this.opts.flavor, this.url("/indexer"), { headers: this.headers() });
  }
}

// --- Download client payload builders ---------------------------------------

export interface QBitDownloadClientSpec {
  kind: "qbittorrent";
  name: string;         // e.g. "qBittorrent"
  host: string;         // e.g. "jellystack-qbittorrent_server_1"
  port: number;         // 8080
  username: string;
  password: string;
  category: string;     // tv | movies | music | books
}

export interface SabDownloadClientSpec {
  kind: "sabnzbd";
  name: string;
  host: string;
  port: number;
  apiKey: string;
  category: string;
}

function buildDownloadClientPayload(spec: QBitDownloadClientSpec | SabDownloadClientSpec) {
  if (spec.kind === "qbittorrent") {
    return {
      enable: true,
      name: spec.name,
      implementation: "QBittorrent",
      configContract: "QBittorrentSettings",
      protocol: "torrent",
      priority: 1,
      removeCompletedDownloads: true,
      removeFailedDownloads: true,
      fields: [
        { name: "host", value: spec.host },
        { name: "port", value: spec.port },
        { name: "username", value: spec.username },
        { name: "password", value: spec.password },
        { name: "category", value: spec.category },
        { name: "initialState", value: 0 },
        { name: "useSsl", value: false },
      ],
      tags: [],
    };
  }
  return {
    enable: true,
    name: spec.name,
    implementation: "Sabnzbd",
    configContract: "SabnzbdSettings",
    protocol: "usenet",
    priority: 1,
    fields: [
      { name: "host", value: spec.host },
      { name: "port", value: spec.port },
      { name: "apiKey", value: spec.apiKey },
      { name: "category", value: spec.category },
      { name: "useSsl", value: false },
    ],
    tags: [],
  };
}
