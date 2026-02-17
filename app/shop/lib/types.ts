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

export type CreateOrderPayload = {
  productId: string;
  color: string;
  size: string;
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
  selectedColor: string;
  selectedSize: string;
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

export type CreateProductPayload = {
  name: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  bulk_pricing: BulkPricingTier[];
  in_stock: boolean;
};
