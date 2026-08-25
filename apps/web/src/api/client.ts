import createClient from "openapi-fetch";

import type { paths } from "@/api/schema";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000";
let accessToken: string | undefined;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setApiAccessToken(token: string | undefined) {
  accessToken = token;
}

export const apiClient = createClient<paths>({ baseUrl: apiBaseUrl });

export async function authenticatedJson<T>(path: string): Promise<T> {
  return apiJson<T>(path);
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as
      | { message?: string; error?: string }
      | undefined;
    throw new ApiError(
      response.status,
      error?.message ?? error?.error ?? `Request failed with status ${response.status}`,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

apiClient.use({
  onRequest({ request }) {
    if (accessToken) request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
});

export async function responseData<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): Promise<T> {
  if (result.data !== undefined) return result.data;

  const error = result.error as { message?: string; error?: string } | undefined;
  throw new ApiError(
    result.response.status,
    error?.message ?? error?.error ?? `Request failed with status ${result.response.status}`,
  );
}
