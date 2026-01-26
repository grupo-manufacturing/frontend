export interface Manufacturer {
  id: number;
  manufacturer_id?: string;
  phone_number: string;
  unit_name?: string;
  business_name?: string;
  business_type?: string;
  is_verified: boolean;
  gst_number?: string;
  msme_number?: string;
  manufacturing_unit_image_url?: string;
  created_at: string;
}

export interface Buyer {
  id: number;
  buyer_identifier?: string;
  phone_number: string;
  full_name?: string;
  business_name?: string;
  created_at: string;
}

export interface Order {
  id: string;
  requirement_no?: string;
  requirement_text: string;
  quantity?: number;
  product_type?: string;
  buyer_id: string;
  buyer?: {
    id: string;
    full_name?: string;
    phone_number: string;
    business_address?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AIDesignResponse {
  id: string;
  ai_design_id: string;
  manufacturer_id: string;
  price_per_unit?: number;
  quantity?: number;
  quoted_price?: number;
  status: string;
  created_at: string;
  manufacturer?: {
    id: string;
    unit_name?: string;
    phone_number: string;
  };
}

export interface AIDesign {
  id: string;
  buyer_id: string;
  design_no?: string;
  image_url: string;
  apparel_type: string;
  design_description?: string;
  quantity: number;
  preferred_colors?: string;
  print_placement?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  buyer?: {
    id: string;
    full_name?: string;
    phone_number: string;
  };
  responses?: AIDesignResponse[];
}

export type UserType = 'buyers' | 'manufacturers';
export type OrderType = 'custom' | 'ai';
export type OrderStatusFilter = 'all' | 'accepted' | 'rejected' | 'submitted';

