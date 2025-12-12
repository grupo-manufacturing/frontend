export interface Manufacturer {
  id: number;
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

export interface Design {
  id: string;
  product_name: string;
  image_url?: string;
  product_category?: string;
  description?: string;
  price_1_50?: number;
  price_51_100?: number;
  price_101_200?: number;
  min_quantity?: number;
  tags?: string[];
  manufacturer_profiles?: {
    unit_name?: string;
    phone_number?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface AIDesign {
  id: string;
  buyer_id: string;
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
}

export type UserType = 'buyers' | 'manufacturers';
export type OrderStatusFilter = 'all' | 'accepted' | 'rejected' | 'submitted';

