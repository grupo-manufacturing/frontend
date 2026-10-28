import { listPath, type ListFilters, type OrderItem, type OrderStatus, type StatusEvent } from '../admin/api';
import { createSession } from '../admin/session';

export { AuthError as ManufacturerAuthError } from '../admin/session';

export const manufacturerSession = createSession('grupo_manufacturer_session');
export const { expire: expireManufacturerSession } = manufacturerSession;

export type ManufacturerProfile = {
  id: string;
  companyName: string;
  email: string;
  manufacturerType: 'garments' | 'fabric';
};

export async function manufacturerLogin(email: string, password: string): Promise<void> {
  await manufacturerSession.login('/api/manufacturer/login', { email, password });
}

export function fetchMe(token: string) {
  return manufacturerSession.request<ManufacturerProfile>(token, '/api/manufacturer/me', 'Failed to load your account.');
}

export type ManufacturerDetails = ManufacturerProfile & {
  phone: string;
  location: string;
  gstNumber: string;
  fabrics: string | null;
  products: string[];
  winnerProduct: string | null;
};

export type ProfileInput =
  | { phone: string; location: string; fabrics: string }
  | { phone: string; location: string; products: string[]; winnerProduct: string };

export function fetchProfile(token: string) {
  return manufacturerSession.request<ManufacturerDetails>(token, '/api/manufacturer/profile', 'Failed to load your profile.');
}

export function updateProfile(token: string, input: ProfileInput) {
  return manufacturerSession.request<ManufacturerDetails>(token, '/api/manufacturer/profile', 'Failed to save your profile.', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export type ManufacturerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  manufacturerTotal: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
};

export type ManufacturerOrderDetail = ManufacturerOrder & {
  shippingAddress: string;
  techPackUrl: string | null;
  updatedAt: string;
  timeline: StatusEvent[];
};

export type ManufacturerOrderPage = {
  orders: ManufacturerOrder[];
  total: number;
  counts?: Record<string, number>;
  page: number;
  pageSize: number;
};

export function fetchManufacturerOrders(token: string, page: number, pageSize: number, filters: ListFilters = {}) {
  return manufacturerSession.request<ManufacturerOrderPage>(
    token,
    listPath('/api/manufacturer/orders', page, pageSize, filters),
    'Failed to load orders.',
  );
}

export function fetchManufacturerOrder(token: string, id: string) {
  return manufacturerSession.request<ManufacturerOrderDetail>(
    token,
    `/api/manufacturer/orders/${encodeURIComponent(id)}`,
    'Failed to load order.',
  );
}

export function updateManufacturerOrderStatus(token: string, id: string, status: OrderStatus) {
  return manufacturerSession.request<ManufacturerOrderDetail>(
    token,
    `/api/manufacturer/orders/${encodeURIComponent(id)}/status`,
    'Failed to update status.',
    { method: 'PATCH', body: JSON.stringify({ status }) },
  );
}
