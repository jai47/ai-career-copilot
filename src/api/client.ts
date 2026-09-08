import type { ApiErrorPayload } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly detail: unknown;

  constructor(message: string, statusCode: number, code: string, detail: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** User-facing message from an API/network failure. */
export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === 'EMAIL_EXISTS') return 'Email already exists';
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function authHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: Partial<ApiErrorPayload> & { detail?: unknown } = {};
  try {
    payload = await response.json();
  } catch {
    payload = { error: response.statusText || 'Request failed', code: 'UNKNOWN' };
  }
  const detailText =
    typeof payload.detail === 'string'
      ? payload.detail
      : typeof payload.detail === 'object' && payload.detail !== null
        ? JSON.stringify(payload.detail)
        : null;
  const message =
    payload.error ??
    (typeof payload.detail === 'string' ? payload.detail : null) ??
    response.statusText ??
    'Request failed';
  return new ApiError(
    message,
    response.status,
    payload.code ?? 'UNKNOWN',
    payload.detail ?? detailText,
  );
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function apiGet<T>(
  token: string | null,
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${API_URL}${path}${params ? buildQuery(params) : ''}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: authHeaders(token), signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      `Cannot reach backend at ${API_URL}. Is the API server running?`,
      0,
      'CONNECTION_ERROR',
    );
  }
  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiPatch<T>(
  token: string | null,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}

export async function apiPut<T>(
  token: string | null,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiDelete<T>(
  token: string | null,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiPost<T>(
  token: string | null,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  timeoutMs = 120_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const combined = signal
    ? (() => {
        signal.addEventListener('abort', () => controller.abort());
        return controller.signal;
      })()
    : controller.signal;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combined,
    });
    if (!response.ok) throw await parseError(response);
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, 'TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiPostForm<T>(
  token: string | null,
  path: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}

export async function apiPostBytes(
  token: string | null,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export async function apiGetBytes(
  token: string | null,
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export { API_URL };
