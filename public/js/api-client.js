// API client — wraps fetch for /api/* calls
import { t } from './i18n.js';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function getAuthToken() {
  return sessionStorage.getItem('fodmap-auth-token') || '';
}

export function setAuthToken(token) {
  sessionStorage.setItem('fodmap-auth-token', token);
}

export function clearAuthToken() {
  sessionStorage.removeItem('fodmap-auth-token');
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function api(path, options = {}) {
  const { method = 'GET', body, signal, timeout = 30000 } = options;

  const controller = signal ? undefined : new AbortController();
  const timeoutId = !signal ? setTimeout(() => controller.abort(), timeout) : undefined;

  try {
    const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`/api/${path}`, {
      method,
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      signal: signal || controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.status === 401) {
      clearAuthToken();
      window.location.reload();
      throw new ApiError(t('loginError'), 401);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.error || t('error'), res.status);
    }

    return data;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Request timeout', 408);
    throw new ApiError(t('error'), 0);
  }
}

export async function login(user, password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || t('loginError'), res.status);
  }

  setAuthToken(data.token);
  return data;
}
