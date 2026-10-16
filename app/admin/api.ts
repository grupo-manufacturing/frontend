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

export type ListFilters = { status?: string; search?: string; withCounts?: boolean };

async function adminRequest<T>(token: string, path: string, fallbackError: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${OMS_API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (res.status === 401) throw new AdminAuthError('Your session has expired. Please log in again.');
  if (!res.ok) {
    const details = Array.isArray(body.details) ? body.details.join(' · ') : '';
    throw new Error(details || body.error || fallbackError);
  }
  return body as T;
}

function listPath(base: string, page: number, pageSize: number, filters: ListFilters) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('q', filters.search);
  if (filters.withCounts === false) params.set('counts', '0');
  return `${base}?${params}`;
}

export function fetchAdminRfqs(token: string, page: number, pageSize: number, filters: ListFilters = {}) {
  return adminRequest<AdminRfqPage>(token, listPath('/api/admin/rfqs', page, pageSize, filters), 'Failed to load RFQs.');
}

export async function updateRfqStatus(token: string, id: string, status: string): Promise<void> {
  await adminRequest(token, `/api/admin/rfqs/${encodeURIComponent(id)}/status`, 'Failed to update status.', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export type Manufacturer = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type ManufacturerInput = Pick<Manufacturer, 'companyName' | 'email' | 'phone' | 'location' | 'status'>;

export type ManufacturerPage = {
  manufacturers: Manufacturer[];
  total: number;
  counts?: Record<string, number>;
  page: number;
  pageSize: number;
};

export function fetchManufacturers(token: string, page: number, pageSize: number, filters: ListFilters = {}) {
  return adminRequest<ManufacturerPage>(
    token,
    listPath('/api/admin/manufacturers', page, pageSize, filters),
    'Failed to load manufacturers.',
  );
}

export function createManufacturer(token: string, input: ManufacturerInput) {
  return adminRequest<Manufacturer>(token, '/api/admin/manufacturers', 'Failed to add manufacturer.', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateManufacturer(token: string, id: string, input: Partial<ManufacturerInput>) {
  return adminRequest<Manufacturer>(token, `/api/admin/manufacturers/${encodeURIComponent(id)}`, 'Failed to update manufacturer.', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteManufacturer(token: string, id: string): Promise<void> {
  await adminRequest(token, `/api/admin/manufacturers/${encodeURIComponent(id)}`, 'Failed to delete manufacturer.', {
    method: 'DELETE',
  });
}
