import { OMS_API_URL } from '../request-for-quotation/api';
import { toast } from './toast';

export class AuthError extends Error {}

export type Session = ReturnType<typeof createSession>;

/** A login session kept in localStorage under its own key, so admin and manufacturer logins don't clash. */
export function createSession(storageKey: string) {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', listener);
    };
  }

  function getToken(): string | null {
    try {
      const session = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      if (typeof session?.token !== 'string' || typeof session?.expiresAt !== 'number') return null;
      return session.expiresAt > Date.now() ? session.token : null;
    } catch {
      return null;
    }
  }

  function save(token: string, expiresAt: number) {
    localStorage.setItem(storageKey, JSON.stringify({ token, expiresAt }));
    notify();
  }

  function clear() {
    localStorage.removeItem(storageKey);
    notify();
  }

  /** Ends the session after the backend rejects the token. Several requests can fail at once, so only the first one toasts. */
  function expire() {
    if (getToken()) toast.info('Your session has expired. Please log in again.');
    clear();
  }

  function logout() {
    clear();
    toast.info('You have been logged out.');
  }

  /** Signs in against a login endpoint that answers with { token, expiresAt, ... } and returns the rest of the body. */
  async function login<T = unknown>(path: string, credentials: Record<string, string>): Promise<T> {
    const res = await fetch(`${OMS_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 429) throw new Error('Too many login attempts. Please try again in 15 minutes.');
      throw new Error(body.error || 'Login failed. Please try again.');
    }

    save(body.token, body.expiresAt);
    return body as T;
  }

  async function request<T>(token: string, path: string, fallbackError: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${OMS_API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const body = res.status === 204 ? {} : await res.json().catch(() => ({}));

    if (res.status === 401) throw new AuthError('Your session has expired. Please log in again.');
    if (!res.ok) {
      const details = Array.isArray(body.details) ? body.details.join(' · ') : '';
      throw new Error(details || body.error || fallbackError);
    }
    return body as T;
  }

  return { subscribe, getToken, clear, expire, logout, login, request };
}
