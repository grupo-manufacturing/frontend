export interface Manufacturer {
  id: number;
  manufacturer_id?: string;
  phone_number: string;
  unit_name?: string;
  business_name?: string;
  business_type?: string;
  verified: boolean;
  verification_status?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Buyer {
  id: number;
  phone_number: string;
  full_name?: string;
  business_name?: string;
  created_at: string;
}

export interface Order {
  id: string;
  requirement: {
    requirement_no?: string;
    requirement_text: string;
    quantity?: number;
    product_type?: string;
    buyer: {
      full_name?: string;
      phone_number: string;
    };
  };
  manufacturer: {
    unit_name?: string;
    phone_number: string;
    location?: string;
  };
  quoted_price: number;
  price_per_unit: number;
  delivery_time: string;
  status: string;
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

