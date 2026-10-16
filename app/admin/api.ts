import { OMS_API_URL } from '../request-for-quotation/api';

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
  counts?: Record<string, number>;
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

export async function fetchAdminRfqs(
  token: string,
  page: number,
  pageSize: number,
  filters: { status?: string; search?: string; withCounts?: boolean } = {},
): Promise<AdminRfqPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('q', filters.search);
  if (filters.withCounts === false) params.set('counts', '0');

  const res = await fetch(`${OMS_API_URL}/api/admin/rfqs?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) throw new AdminAuthError('Your session has expired. Please log in again.');
  if (!res.ok) throw new Error(body.error || 'Failed to load RFQs.');
  return body as AdminRfqPage;
}

export async function updateRfqStatus(token: string, id: string, status: string): Promise<void> {
  const res = await fetch(`${OMS_API_URL}/api/admin/rfqs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) throw new AdminAuthError('Your session has expired. Please log in again.');
  if (!res.ok) throw new Error(body.error || 'Failed to update status.');
}
