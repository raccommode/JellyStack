/**
 * Service registry — the JellyStack panel is part of a monolithic compose
 * project, so it reaches sibling services by their Docker service name
 * (Compose creates a default bridge network where `http://sonarr:8989`
 * resolves to the sonarr container). This file is the single source of truth
 * for "what services exist and how to reach them".
 */

export type ServiceId =
  | "jellyfin"
  | "sonarr"
  | "radarr"
  | "lidarr"
  | "readarr"
  | "bazarr"
  | "prowlarr"
  | "jellyseerr"
  | "qbittorrent"
  | "sabnzbd"
  | "jdownloader"
  | "gluetun"
  | "flaresolverr"
  | "tautulli"
  | "jellystat"
  | "dozzle"
  | "unpackerr"
  | "autobrr"
  | "janitorr"
  | "profilarr"
  | "tdarr"
  | "kapowarr"
  | "wizarr"
  | "navidrome"
  | "kavita"
  | "audiobookshelf";

export type ServiceCategory =
  | "media"
  | "requests"
  | "download"
  | "automation"
  | "transcoding"
  | "monitoring"
  | "extras";

export interface ServiceDef {
  id: ServiceId;
  /** Display name shown in the panel UI. */
  label: string;
  category: ServiceCategory;
  /** Internal port the app listens on inside its container. */
  port: number;
  /** Optional sub-path (e.g. some apps serve on /web). */
  path?: string;
  /** Whether the web UI can be embedded in an iframe from the panel. */
  iframeable: boolean;
  /** Whether the service exposes a REST API the panel can auto-configure. */
  apiIntegration: boolean;
}

export const SERVICES: ServiceDef[] = [
  // Media core
  { id: "jellyfin",       label: "Jellyfin",       category: "media",        port: 8096, iframeable: false, apiIntegration: true  },
  { id: "sonarr",         label: "Sonarr",         category: "media",        port: 8989, iframeable: true,  apiIntegration: true  },
  { id: "radarr",         label: "Radarr",         category: "media",        port: 7878, iframeable: true,  apiIntegration: true  },
  { id: "lidarr",         label: "Lidarr",         category: "media",        port: 8686, iframeable: true,  apiIntegration: true  },
  { id: "readarr",        label: "Readarr",        category: "media",        port: 8787, iframeable: true,  apiIntegration: true  },
  { id: "bazarr",         label: "Bazarr",         category: "media",        port: 6767, iframeable: true,  apiIntegration: true  },
  { id: "prowlarr",       label: "Prowlarr",       category: "media",        port: 9696, iframeable: true,  apiIntegration: true  },

  // Requests
  { id: "jellyseerr",     label: "Jellyseerr",     category: "requests",     port: 5055, iframeable: false, apiIntegration: true  },

  // Download
  { id: "qbittorrent",    label: "qBittorrent",    category: "download",     port: 8080, iframeable: true,  apiIntegration: true  },
  { id: "sabnzbd",        label: "SABnzbd",        category: "download",     port: 8080, iframeable: true,  apiIntegration: true  },
  { id: "jdownloader",    label: "JDownloader",    category: "download",     port: 5800, iframeable: true,  apiIntegration: false },
  { id: "gluetun",        label: "Gluetun (VPN)",  category: "download",     port: 8000, iframeable: false, apiIntegration: false },
  { id: "flaresolverr",   label: "FlareSolverr",   category: "download",     port: 8191, iframeable: false, apiIntegration: false },

  // Monitoring
  { id: "tautulli",       label: "Tautulli",       category: "monitoring",   port: 8181, iframeable: true,  apiIntegration: false },
  { id: "jellystat",      label: "Jellystat",      category: "monitoring",   port: 3000, iframeable: true,  apiIntegration: false },
  { id: "dozzle",         label: "Dozzle",         category: "monitoring",   port: 8080, iframeable: true,  apiIntegration: false },

  // Automation
  { id: "unpackerr",      label: "Unpackerr",      category: "automation",   port: 5656, iframeable: true,  apiIntegration: false },
  { id: "autobrr",        label: "Autobrr",        category: "automation",   port: 7474, iframeable: true,  apiIntegration: false },
  { id: "janitorr",       label: "Janitorr",       category: "automation",   port: 8978, iframeable: true,  apiIntegration: false },
  { id: "profilarr",      label: "Profilarr",      category: "automation",   port: 6868, iframeable: true,  apiIntegration: false },

  // Transcoding
  { id: "tdarr",          label: "Tdarr",          category: "transcoding",  port: 8265, iframeable: true,  apiIntegration: false },

  // Extras
  { id: "kapowarr",       label: "Kapowarr",       category: "extras",       port: 5656, iframeable: true,  apiIntegration: false },
  { id: "wizarr",         label: "Wizarr",         category: "extras",       port: 5690, iframeable: false, apiIntegration: false },
  { id: "navidrome",      label: "Navidrome",      category: "extras",       port: 4533, iframeable: false, apiIntegration: false },
  { id: "kavita",         label: "Kavita",         category: "extras",       port: 5000, iframeable: false, apiIntegration: false },
  { id: "audiobookshelf", label: "Audiobookshelf", category: "extras",       port: 80,   iframeable: false, apiIntegration: false },
];

/** Internal URL the panel uses to talk to a service (Docker DNS). */
export function internalUrl(def: ServiceDef): string {
  const path = def.path ?? "";
  return `http://${def.id}:${def.port}${path}`;
}

export function getService(id: ServiceId): ServiceDef {
  const svc = SERVICES.find((s) => s.id === id);
  if (!svc) throw new Error(`Unknown service id: ${id}`);
  return svc;
}
