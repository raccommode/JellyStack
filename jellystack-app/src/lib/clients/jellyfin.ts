/**
 * Jellyfin API client. We use API keys (generated from the admin UI or read
 * out of `/config/data/system.xml`) rather than the user/password login flow —
 * the panel is going to be provisioning new servers, not mimicking a real user.
 */

import { request } from "./base";

export interface JellyfinClientOptions {
  baseUrl: string;     // http://jellyfin_server_1:8096
  apiKey: string;
}

export interface JellyfinPublicInfo {
  LocalAddress: string;
  ServerName: string;
  Version: string;
  Id: string;
  StartupWizardCompleted: boolean;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  HasPassword: boolean;
  Policy?: {
    IsAdministrator: boolean;
    IsDisabled: boolean;
  };
}

export class JellyfinClient {
  constructor(private readonly opts: JellyfinClientOptions) {}

  private url(path: string): string {
    return `${this.opts.baseUrl.replace(/\/$/, "")}${path}`;
  }

  private headers(): Record<string, string> {
    // Jellyfin accepts both header styles; the Authorization line is the
    // one that works with API keys cleanly.
    return {
      "X-Emby-Token": this.opts.apiKey,
      Authorization: `MediaBrowser Token="${this.opts.apiKey}"`,
    };
  }

  /** Works without an API key; used to confirm the server is reachable. */
  publicInfo(): Promise<JellyfinPublicInfo> {
    return request("jellyfin", this.url("/System/Info/Public"));
  }

  listUsers(): Promise<JellyfinUser[]> {
    return request("jellyfin", this.url("/Users"), { headers: this.headers() });
  }

  createUser(name: string, password: string): Promise<JellyfinUser> {
    return request("jellyfin", this.url("/Users/New"), {
      method: "POST",
      headers: this.headers(),
      body: { Name: name, Password: password },
    });
  }
}
