export interface Supplier {
  id: string;
  email: string;
  password?: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  wallet_address?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  category: string;
  price_usd: number;
  price_btc: number;
  stock: number;
  image_url: string;
  images?: string[];
  status: 'active' | 'draft' | 'archived';
  sku?: string;
  discount_percent?: number;
  original_price_usd?: number;
  free_shipping?: boolean;
  shipping_type?: 'free' | 'express' | 'standard';
  rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
  // joined fields
  suppliers?: {
    company_name: string;
    email: string;
    wallet_address?: string;
    avatar_url?: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_wallet: string;
  payment_tx_hash: string;
  payment_currency: string;
  total_usd: number;
  total_btc: number;
  status: 'completed' | 'pending' | 'cancelled';
  voucher_code: string;
  signature_nexcoin?: string;
  contract_address?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  supplier_id?: string;
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  unit_price_btc: number;
  total_usd: number;
  total_btc: number;
  created_at?: string;
}
