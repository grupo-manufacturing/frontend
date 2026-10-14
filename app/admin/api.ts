import { OMS_API_URL } from '../rfq/api';

const SESSION_KEY = 'grupo_admin_session';

export type AdminRfq = {
  id: string;
  rfqNumber: string;
  name: string;
  brandName: string;
  email: string;
  phone: string;
  techPackUrl: string | null;
  location: string;
  status: string;
  createdAt: string;
  items: { product: string; quantity: number }[];
};

export type AdminRfqPage = {
  rfqs: AdminRfq[];
  total: number;
  page: number;
  pageSize: number;
};

export class AdminAuthError extends Error {}

const sessionListeners = new Set<() => void>();

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getSessionToken(): string | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    if (typeof session?.token !== 'string' || typeof session?.expiresAt !== 'number') return null;
    return session.expiresAt > Date.now() ? session.token : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  notifySessionListeners();
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const res = await fetch(`${OMS_API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429) throw new Error('Too many login attempts. Please try again in 15 minutes.');
    throw new Error(body.error || 'Login failed. Please try again.');
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: body.token, expiresAt: body.expiresAt }));
  notifySessionListeners();
}

export async function fetchAdminRfqs(token: string, page: number, pageSize: number): Promise<AdminRfqPage> {
  const res = await fetch(`${OMS_API_URL}/api/admin/rfqs?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) throw new AdminAuthError('Your session has expired. Please log in again.');
  if (!res.ok) throw new Error(body.error || 'Failed to load RFQs.');
  return body as AdminRfqPage;
}
