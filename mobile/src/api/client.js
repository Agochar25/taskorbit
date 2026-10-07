import { API_URL } from './config';

const AUTH_ERRORS = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHENTICATED'];
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

let tokens = { accessToken: null, refreshToken: null };
let refreshPromise = null;
const hooks = { persist: async () => {}, onExpired: () => {} };

export const configureApi = (h) => Object.assign(hooks, h);
export const setTokens = (t) => { tokens = { accessToken: t?.accessToken || null, refreshToken: t?.refreshToken || null }; };
export const getRefreshToken = () => tokens.refreshToken;

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'android',
        ...(auth && tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK', e?.name === 'AbortError'
      ? 'The server took too long to respond. Please try again.'
      : "You're offline or the server can't be reached. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error?.code || 'ERROR', json?.error?.message || 'Request failed', json?.error?.details);
  return json;
}

function refresh() {
  if (!tokens.refreshToken) return Promise.resolve(null);
  refreshPromise ||= request('/auth/refresh', { method: 'POST', body: { refreshToken: tokens.refreshToken }, auth: false })
    .then(async (r) => { setTokens(r); await hooks.persist(r); return r; })
    .catch((err) => { if (err.code === 'NETWORK') throw err; return null; })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

/** Calls the API; on an expired access token it silently refreshes once, otherwise sends the user to login. */
export async function api(path, opts = {}) {
  try {
    return await request(path, opts);
  } catch (err) {
    if (opts.auth !== false && err.status === 401 && AUTH_ERRORS.includes(err.code)) {
      const renewed = await refresh();
      if (renewed) return request(path, opts);
      hooks.onExpired(SESSION_EXPIRED_MESSAGE);
      throw new ApiError(401, 'SESSION_EXPIRED', SESSION_EXPIRED_MESSAGE);
    }
    throw err;
  }
}

export const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
