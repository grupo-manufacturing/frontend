import { createSession } from './session';

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

export { AuthError as AdminAuthError } from './session';

export const adminSession = createSession('grupo_admin_session');
export const { expire: expireSession, logout } = adminSession;
const adminRequest = adminSession.request;

export async function adminLogin(username: string, password: string): Promise<void> {
  await adminSession.login('/api/admin/login', { username, password });
}

export type ListFilters = { status?: string; search?: string; withCounts?: boolean };

export function listPath(base: string, page: number, pageSize: number, filters: ListFilters) {
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
  password: string;
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

type ManufacturerBaseInput = Pick<Manufacturer, 'companyName' | 'email' | 'password' | 'phone' | 'location' | 'gstNumber' | 'status'>;

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

export type OrderStatus = 'confirmed' | 'sampling' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

export type Shipment = { courierCompany: string; trackingId: string; notes: string | null };

export type ShipmentInput = { courierCompany: string; trackingId: string; notes?: string };

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'other';

export type PaymentParty = 'customer' | 'manufacturer';

export type OrderItem = { product: string; quantity: number };

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
  method: PaymentMethod;
  reference: string | null;
  createdAt: string;
};

export type AdminOrderDetail = Omit<AdminOrder, 'rfqNumber' | 'manufacturerName'> & {
  shippingAddress: string;
  shipment: Shipment | null;
  updatedAt: string;
  rfq: { id: string; rfqNumber: string; location: string; techPackUrl: string | null };
  manufacturer: { id: string; companyName: string; email: string; phone: string; location: string };
  payments: OrderPayment[];
  timeline: StatusEvent[];
};

export type StatusEvent = { id: string; status: OrderStatus; changedBy: 'admin' | 'manufacturer'; createdAt: string };

export type ConvertRfqInput = {
  manufacturerId: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  manufacturerTotal: number;
  amountReceived: number;
  receivedMethod: PaymentMethod;
  receivedReference?: string;
  amountPaidToManufacturer: number;
  manufacturerPaymentMethod?: PaymentMethod;
  manufacturerPaymentReference?: string;
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

export function updateOrderStatus(token: string, id: string, status: OrderStatus, shipment?: ShipmentInput) {
  return adminRequest<AdminOrderDetail>(token, `/api/admin/orders/${encodeURIComponent(id)}/status`, 'Failed to update status.', {
    method: 'PATCH',
    body: JSON.stringify({ status, shipment }),
  });
}

export type AnalyticsPeriod = 'this_month' | 'last_3_months' | 'all_time';

export type RfqStatus = 'lead' | 'quotation' | 'won' | 'lost';

export type Analytics = {
  period: AnalyticsPeriod;
  summary: { revenue: number; manufacturerCost: number; netProfit: number; orders: number };
  cash: { received: number; receivable: number; paidToManufacturers: number; payableToManufacturers: number };
  rfqFunnel: { counts: Record<RfqStatus, number>; winRate: number | null };
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: { product: string; units: number; orders: number }[];
  topManufacturers: { id: string; name: string; orders: number; value: number; profit: number }[];
  monthlyTrend: { month: string; orders: number; revenue: number; profit: number }[];
};

export function fetchAnalytics(token: string, period: AnalyticsPeriod) {
  return adminRequest<Analytics>(token, `/api/admin/analytics?period=${period}`, 'Failed to load analytics.');
}

export function addOrderPayment(token: string, id: string, input: PaymentInput) {
  return adminRequest<AdminOrderDetail>(token, `/api/admin/orders/${encodeURIComponent(id)}/payments`, 'Failed to add payment.', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
