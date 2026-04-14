/**
 * Tiny fetch wrapper shared by every API client in `src/lib/clients/*`.
 *
 * Design goals:
 *   - Tight error messages that include the upstream app id (so wizard logs
 *     read "sonarr: 401 Unauthorized" instead of "fetch failed").
 *   - Idempotent-friendly: callers can detect 4xx vs 5xx and decide whether
 *     to retry or skip.
 *   - Zero third-party deps beyond the built-in `fetch`.
 */

export class ApiError extends Error {
  constructor(
    public readonly app: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string,
  ) {
    super(`${app}: HTTP ${status} ${statusText}`.trim());
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  /** Milliseconds. Defaults to 10 s so a hung app doesn't freeze the wizard. */
  timeoutMs?: number;
}

/**
 * Issues an HTTP request and parses the JSON body. Throws `ApiError` for any
 * non-2xx response so callers can `catch` and decide whether to continue.
 */
export async function request<T = unknown>(
  app: string,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = 10_000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(app, 0, message.includes("aborted") ? "Timeout" : "NetworkError", message);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new ApiError(app, res.status, res.statusText, bodyText);
  }

  // Some endpoints return 204 No Content.
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

/** Returns true if an error is a 4xx ApiError (caller's problem, don't retry). */
export function isClientError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status >= 400 && err.status < 500;
}
