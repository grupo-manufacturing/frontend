import type { ShopProduct, ShopOrder, BulkPricingTier, CreateProductPayload, CreateOrderPayload, OrderResponse, ColorVariation, RazorpayOrderResponse, VerifyPaymentPayload } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_SHOP_API_URL || 'https://shop-backend-31w8.onrender.com';

// const BASE_URL = process.env.NEXT_PUBLIC_SHOP_API_URL || 'http://localhost:5001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function normaliseTier(t: Record<string, unknown>): BulkPricingTier {
  return {
    label: t.label as string,
    range: t.range as string,
    unitPrice: (t.unitPrice ?? t.unit_price ?? 0) as number,
    ...(t.isRFQ ? { isRFQ: true } : {}),
  };
}

function normaliseProduct(raw: Record<string, unknown>): ShopProduct {
  const pricing = (raw.bulk_pricing ?? raw.bulkPricing ?? []) as Record<string, unknown>[];
  return {
    id: raw.id as string,
    name: raw.name as string,
    category: raw.category as string,
    description: (raw.description ?? "") as string,
    image: raw.image as string,
    images: (raw.images ?? []) as string[],
    colors: (raw.colors ?? []) as string[],
    sizes: (raw.sizes ?? []) as string[],
    bulkPricing: pricing.map(normaliseTier),
    manufacturingTime: (raw.manufacturing_time ?? raw.manufacturingTime ?? 7) as number,
    inStock: (raw.in_stock ?? raw.inStock ?? true) as boolean,
    createdAt: (raw.created_at ?? "") as string,
    updatedAt: (raw.updated_at ?? "") as string,
  };
}

function normaliseOrder(raw: Record<string, unknown>): ShopOrder {
  const s = (k1: string, k2: string, d: unknown) => raw[k1] ?? raw[k2] ?? d;
  return {
    id: raw.id as string,
    orderNumber: s('order_number', 'orderNumber', '') as string,
    productId: s('product_id', 'productId', '') as string,
    productName: s('product_name', 'productName', '') as string,
    productImage: s('product_image', 'productImage', '') as string,
    variations: (raw.variations ?? []) as ColorVariation[],
    quantity: (raw.quantity ?? 0) as number,
    tier: (raw.tier ?? "") as string,
    unitPrice: s('unit_price', 'unitPrice', 0) as number,
    totalAmount: s('total_amount', 'totalAmount', 0) as number,
    customerName: s('customer_name', 'customerName', '') as string,
    customerEmail: s('customer_email', 'customerEmail', '') as string,
    customerPhone: s('customer_phone', 'customerPhone', '') as string,
    customerCompany: s('customer_company', 'customerCompany', null) as string | null,
    address: (raw.address ?? "") as string,
    city: (raw.city ?? "") as string,
    state: (raw.state ?? "") as string,
    pincode: (raw.pincode ?? "") as string,
    status: (raw.status ?? "pending") as string,
    createdAt: (raw.created_at ?? "") as string,
    updatedAt: (raw.updated_at ?? "") as string,
  };
}

function buildQS(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export type GetProductsParams = {
  search?: string; category?: string; minPrice?: number; maxPrice?: number;
  inStock?: string; sort?: string; order?: string; page?: number; limit?: number;
};
export type ProductsResponse = { products: ShopProduct[]; total: number; page: number; totalPages: number; };
export type ProductOptions = { categories: string[]; colors: string[]; sizes: string[]; };
export type OrdersResponse = { orders: ShopOrder[]; total: number; page: number; totalPages: number; };

export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
  const raw = await request<{ products: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/products${buildQS(params)}`);
  return { ...raw, products: raw.products.map(normaliseProduct) };
}
export async function getProductById(id: string): Promise<ShopProduct> {
  return normaliseProduct((await request<{ product: Record<string, unknown> }>(`/api/products/${id}`)).product);
}
export async function getCategories(): Promise<string[]> {
  return (await request<{ categories: string[] }>('/api/products/categories')).categories;
}
export async function getProductOptions(): Promise<ProductOptions> {
  return request<ProductOptions>('/api/products/options');
}
export async function placeOrder(payload: CreateOrderPayload): Promise<{ message: string; order: OrderResponse }> {
  return request('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
}
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: fd });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'Image upload failed'); }
  return (await res.json()).url;
}
export async function createProduct(payload: CreateProductPayload): Promise<ShopProduct> {
  return normaliseProduct((await request<{ product: Record<string, unknown> }>('/api/products', { method: 'POST', body: JSON.stringify(payload) })).product);
}
export async function updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<ShopProduct> {
  return normaliseProduct((await request<{ product: Record<string, unknown> }>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) })).product);
}
export async function deleteProduct(id: string): Promise<void> {
  await request<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' });
}
export async function getOrders(params: { status?: string; page?: number; limit?: number } = {}): Promise<OrdersResponse> {
  const raw = await request<{ orders: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/orders${buildQS(params)}`);
  return { ...raw, orders: raw.orders.map(normaliseOrder) };
}
export async function updateOrderStatus(id: string, status: string): Promise<ShopOrder> {
  return normaliseOrder((await request<{ order: Record<string, unknown> }>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })).order);
}

export async function createRazorpayOrder(payload: CreateOrderPayload): Promise<RazorpayOrderResponse> {
  return request<RazorpayOrderResponse>('/api/orders/create-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyPayment(data: VerifyPaymentPayload): Promise<{ message: string; order: OrderResponse }> {
  return request<{ message: string; order: OrderResponse }>('/api/orders/verify-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reportPaymentFailed(orderId: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/orders/payment-failed', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}