export type BulkPricingTier = {
  label: string;
  range: string;
  unitPrice: number;
  isRFQ?: boolean;
};

export type ShopProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  bulkPricing: BulkPricingTier[];
  manufacturingTime: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderCustomer = {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type SizeQty = { size: string; qty: number };
export type ColorVariation = { color: string; sizes: SizeQty[] };

export type CreateOrderPayload = {
  productId: string;
  variations: ColorVariation[];
  quantity: number;
  tier: string;
  customer: OrderCustomer;
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  tier: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  variations: ColorVariation[];
  quantity: number;
  tier: string;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type TrackedOrder = {
  orderNumber: string;
  productName: string;
  productImage: string;
  variations: ColorVariation[];
  quantity: number;
  tier: string;
  unitPrice: number;
  totalAmount: number;
  status: string;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
};

export type RazorpayOrderResponse = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export type VerifyPaymentPayload = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type CreateProductPayload = {
  name: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  bulk_pricing: BulkPricingTier[];
  manufacturing_time: number;
  in_stock: boolean;
};
