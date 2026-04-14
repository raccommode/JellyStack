/**
 * qBittorrent uses a cookie-based session instead of a simple header, so its
 * client is a bit beefier than the *arr clients. We log in once and reuse the
 * `SID` cookie for subsequent calls.
 */

import { ApiError } from "./base";

export interface QBittorrentClientOptions {
  baseUrl: string;
  username: string;
  password: string;
}

export interface QBittorrentCategory {
  name: string;
  savePath: string;
}

export class QBittorrentClient {
  private sidCookie: string | null = null;

  constructor(private readonly opts: QBittorrentClientOptions) {}

  private url(path: string): string {
    return `${this.opts.baseUrl.replace(/\/$/, "")}${path}`;
  }

  private async login(): Promise<void> {
    const res = await fetch(this.url("/api/v2/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // qBittorrent requires a Referer matching its own host; the proxy
        // inside the Docker network takes care of that.
        Referer: this.opts.baseUrl,
      },
      body: `username=${encodeURIComponent(this.opts.username)}&password=${encodeURIComponent(this.opts.password)}`,
    });

    if (!res.ok) throw new ApiError("qbittorrent", res.status, res.statusText);
    const text = await res.text();
    if (text.trim() !== "Ok.") {
      throw new ApiError("qbittorrent", 401, "Login rejected", text);
    }

    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) throw new ApiError("qbittorrent", 500, "No session cookie returned");
    const sid = /SID=([^;]+)/.exec(setCookie)?.[1];
    if (!sid) throw new ApiError("qbittorrent", 500, "Malformed session cookie");
    this.sidCookie = `SID=${sid}`;
  }

  private async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.sidCookie) await this.login();
    const res = await fetch(this.url(path), {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Cookie: this.sidCookie!,
        Referer: this.opts.baseUrl,
      },
    });
    // Session expired → retry once with a fresh login.
    if (res.status === 403) {
      this.sidCookie = null;
      await this.login();
      return fetch(this.url(path), {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Cookie: this.sidCookie!,
          Referer: this.opts.baseUrl,
        },
      });
    }
    return res;
  }

  async version(): Promise<string> {
    const res = await this.fetch("/api/v2/app/version");
    if (!res.ok) throw new ApiError("qbittorrent", res.status, res.statusText);
    return (await res.text()).trim();
  }

  async listCategories(): Promise<Record<string, QBittorrentCategory>> {
    const res = await this.fetch("/api/v2/torrents/categories");
    if (!res.ok) throw new ApiError("qbittorrent", res.status, res.statusText);
    return (await res.json()) as Record<string, QBittorrentCategory>;
  }

  /** Idempotent: skips if the category already exists with the same savePath. */
  async ensureCategory(name: string, savePath: string): Promise<void> {
    const existing = await this.listCategories();
    const current = existing[name];
    if (current && current.savePath === savePath) return;

    const endpoint = current ? "/api/v2/torrents/editCategory" : "/api/v2/torrents/createCategory";
    const res = await this.fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `category=${encodeURIComponent(name)}&savePath=${encodeURIComponent(savePath)}`,
    });
    if (!res.ok) throw new ApiError("qbittorrent", res.status, res.statusText);
  }
}
