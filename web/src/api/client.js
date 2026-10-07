const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const REFRESH_KEY = 'taskorbit.refreshToken';
const AUTH_ERRORS = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHENTICATED'];

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = null; // kept in memory only
let refreshPromise = null;
const handlers = { onExpired: () => {} };

export const configureApi = (h) => Object.assign(handlers, h);
export const hasStoredSession = () => !!localStorage.getItem(REFRESH_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function setSession({ accessToken: a, refreshToken: r }) {
  accessToken = a;
  localStorage.setItem(REFRESH_KEY, r);
}
export function clearSession() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'web',
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.error?.code || 'ERROR', json?.error?.message || 'Request failed', json?.error?.details);
  }
  return json;
}

/** Single-flight refresh so parallel requests (or two effects) never reuse a rotated token. */
export function refreshSession() {
  const token = getRefreshToken();
  if (!token) return Promise.resolve(null);
  refreshPromise ||= request('/auth/refresh', { method: 'POST', body: { refreshToken: token }, auth: false })
    .then((r) => { setSession(r); return r; })
    .catch((err) => {
      if (err.code === 'NETWORK') throw err; // offline is not the same as expired
      clearSession();
      return null;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function api(path, opts = {}) {
  try {
    return await request(path, opts);
  } catch (err) {
    if (opts.auth !== false && err.status === 401 && AUTH_ERRORS.includes(err.code)) {
      const renewed = await refreshSession();
      if (renewed) return request(path, opts);
      handlers.onExpired();
    }
    throw err;
  }
}

export const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
