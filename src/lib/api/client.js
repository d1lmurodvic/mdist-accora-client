/**
 * The one API client (API_CONTRACT.md §1–§5). Every request to the backend
 * goes through `api.*`: base URL, Bearer token, JSON, the success/error
 * envelopes, request ids and error classification live here only.
 *
 * - Success: resolves with `{ data, meta, status, headers }`.
 * - Failure: rejects with an ApiError (see errors.js). A 401 also notifies
 *   the auth layer so it can end the session and send the user to login.
 * - The token is sent as `Authorization: Bearer`, never in a URL.
 */

import { ApiError, NetworkError } from './errors.js';
import { tokenStore } from '../storage.js';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 30000;

const unauthorizedListeners = new Set();

/** Subscribe to "the session is no longer valid" (401). Returns an unsubscribe function. */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function buildUrl(path, query) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.append(key, String(value));
  }
  const text = params.toString();
  return text ? `${url}?${text}` : url;
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * @param {string} method
 * @param {string} path  relative to the API base, e.g. '/auth/me'
 * @param {{ query?: object, body?: object, formData?: FormData, headers?: object, signal?: AbortSignal, auth?: boolean, responseType?: 'json' | 'blob' }} [options]
 */
export async function request(method, path, { query, body, formData, headers = {}, signal, auth = true, responseType = 'json' } = {}) {
  const init = { method, headers: { Accept: 'application/json', ...headers } };
  const token = auth ? tokenStore.get() : null;
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), DEFAULT_TIMEOUT_MS);
  const abort = () => timeout.abort();
  signal?.addEventListener('abort', abort, { once: true });
  init.signal = timeout.signal;

  let response;
  try {
    response = await fetch(buildUrl(path, query), init);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new NetworkError(timeout.signal.aborted ? 'The server took too long to respond.' : 'Could not reach the IFRSmart server.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }

  if (response.ok && responseType === 'blob') {
    return { data: await response.blob(), meta: null, status: response.status, headers: response.headers };
  }
  const payload = await parseBody(response);
  if (response.ok) {
    return { data: payload?.data ?? null, meta: payload?.meta ?? null, status: response.status, headers: response.headers };
  }

  const error = ApiError.fromResponse(response, payload);
  if (error.status === 401 && token) {
    unauthorizedListeners.forEach((listener) => listener(error));
  }
  throw error;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
  upload: (path, formData, options) => request('POST', path, { ...options, formData }),
  /** An authorised file download (e.g. a stored document), as a Blob. */
  blob: (path, options) => request('GET', path, { ...options, responseType: 'blob' }),
};
