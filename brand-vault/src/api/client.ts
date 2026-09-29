import { isTokenExpired } from "../auth/jwt";
import { sessionStore, type Session } from "../auth/session";
import { API_URL } from "../config";
import { ApiError, messageFromBody, NETWORK_ERROR_STATUS } from "./errors";

const REFRESH_MARGIN_MS = 30_000;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

let refreshInFlight: Promise<Session> | null = null;

// Concurrent callers share one refresh: the backend rotates refresh tokens,
// so a second call with the old token would be treated as reuse and revoke the session.
function refreshSession(): Promise<Session> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<Session> {
  const session = sessionStore.get();
  if (!session || isTokenExpired(session.refreshToken)) {
    sessionStore.clear("expired");
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  const response = await send("/auth/refresh", {
    method: "POST",
    body: { refreshToken: session.refreshToken },
  });
  const body = await readBody(response);

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      sessionStore.clear("expired");
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
    throw new ApiError(response.status, messageFromBody(body, "Could not refresh the session."));
  }

  const next = body as Session;
  sessionStore.set(next);
  return next;
}

async function getAccessToken(): Promise<string> {
  const session = sessionStore.get();
  if (!session) {
    throw new ApiError(401, "You are not signed in.");
  }
  if (isTokenExpired(session.accessToken, REFRESH_MARGIN_MS)) {
    return (await refreshSession()).accessToken;
  }
  return session.accessToken;
}

async function send(path: string, options: RequestOptions, accessToken?: string) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(NETWORK_ERROR_STATUS, "Can't reach the server. Check your connection and try again.");
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;

  let token = auth ? await getAccessToken() : undefined;
  let response = await send(path, options, token);

  if (auth && response.status === 401) {
    const latest = sessionStore.get()?.accessToken;
    token = latest && latest !== token ? latest : (await refreshSession()).accessToken;
    response = await send(path, options, token);
    if (response.status === 401) {
      sessionStore.clear("expired");
    }
  }

  const body = await readBody(response);
  if (!response.ok) {
    throw new ApiError(response.status, messageFromBody(body, `Request failed (${response.status}).`));
  }
  return body as T;
}
