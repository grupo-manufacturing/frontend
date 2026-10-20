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
  order: { id: string; orderNumber: string } | null;
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

export type ManufacturerType = 'garments' | 'fabric';

export type Manufacturer = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  location: string;
  gstNumber: string;
  manufacturerType: ManufacturerType;
  fabrics: string | null;
  products: string[];
  winnerProduct: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

type ManufacturerBaseInput = Pick<Manufacturer, 'companyName' | 'email' | 'phone' | 'location' | 'gstNumber' | 'status'>;

export type ManufacturerInput =
  | (ManufacturerBaseInput & { manufacturerType: 'fabric'; fabrics: string })
  | (ManufacturerBaseInput & { manufacturerType: 'garments'; products: string[]; winnerProduct: string });

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

export function updateManufacturer(token: string, id: string, input: ManufacturerInput) {
  return adminRequest<Manufacturer>(token, `/api/admin/manufacturers/${encodeURIComponent(id)}`, 'Failed to update manufacturer.', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteManufacturer(token: string, id: string): Promise<void> {
  await adminRequest(token, `/api/admin/manufacturers/${encodeURIComponent(id)}`, 'Failed to delete manufacturer.', {
    method: 'DELETE',
  });
}

/** Manufacturers an order can be assigned to: active garments manufacturers. */
export async function fetchAssignableManufacturers(token: string): Promise<Manufacturer[]> {
  const params = new URLSearchParams({ page: '1', pageSize: '100', status: 'active', type: 'garments', counts: '0' });
  const page = await adminRequest<ManufacturerPage>(token, `/api/admin/manufacturers?${params}`, 'Failed to load manufacturers.');
  return page.manufacturers;
}

export type OrderStatus = 'confirmed' | 'sampling' | 'in_production' | 'delivered' | 'cancelled';

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'other';

export type PaymentParty = 'customer' | 'manufacturer';

export type OrderItem = {
  product: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  manufacturerUnitPrice: number;
  manufacturerLineTotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  rfqNumber: string;
  status: OrderStatus;
  customerName: string;
  brandName: string;
  email: string;
  phone: string;
  manufacturerName: string;
  items: OrderItem[];
  totalAmount: number;
  amountReceived: number;
  balanceDue: number;
  manufacturerTotal: number;
  amountPaidToManufacturer: number;
  manufacturerBalanceDue: number;
  createdAt: string;
};

export type AdminOrderPage = {
  orders: AdminOrder[];
  total: number;
  counts?: Record<string, number>;
  page: number;
  pageSize: number;
};

export type OrderPayment = {
  id: string;
  party: PaymentParty;
  amount: number;
  paidOn: string;
  method: PaymentMethod | null;
  reference: string | null;
  createdAt: string;
};

export type AdminOrderDetail = Omit<AdminOrder, 'rfqNumber' | 'manufacturerName'> & {
  shippingAddress: string;
  updatedAt: string;
  rfq: { id: string; rfqNumber: string; location: string; techPackUrl: string | null };
  manufacturer: { id: string; companyName: string; email: string; phone: string; location: string };
  payments: OrderPayment[];
};

export type ConvertRfqInput = {
  manufacturerId: string;
  shippingAddress: string;
  items: { product: string; quantity: number; unitPrice: number; manufacturerUnitPrice: number }[];
  amountReceived: number;
  amountPaidToManufacturer: number;
};

export type PaymentInput = { party: PaymentParty; amount: number; paidOn: string; method: PaymentMethod; reference?: string };

export function convertRfqToOrder(token: string, rfqId: string, input: ConvertRfqInput) {
  return adminRequest<{ id: string; orderNumber: string }>(
    token,
    `/api/admin/rfqs/${encodeURIComponent(rfqId)}/convert`,
    'Failed to convert RFQ to order.',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function fetchOrders(token: string, page: number, pageSize: number, filters: ListFilters = {}) {
  return adminRequest<AdminOrderPage>(token, listPath('/api/admin/orders', page, pageSize, filters), 'Failed to load orders.');
}

export function fetchOrder(token: string, id: string) {
  return adminRequest<AdminOrderDetail>(token, `/api/admin/orders/${encodeURIComponent(id)}`, 'Failed to load order.');
}

export function updateOrderStatus(token: string, id: string, status: OrderStatus) {
  return adminRequest<AdminOrderDetail>(token, `/api/admin/orders/${encodeURIComponent(id)}/status`, 'Failed to update status.', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function addOrderPayment(token: string, id: string, input: PaymentInput) {
  return adminRequest<AdminOrderDetail>(token, `/api/admin/orders/${encodeURIComponent(id)}/payments`, 'Failed to add payment.', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
