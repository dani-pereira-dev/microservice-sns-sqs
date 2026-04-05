import { CartStatus } from '@shared/contracts/cart';

export interface CartRow {
  id: string;
  customer_name: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
  checked_out_order_id: string | null;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  product_title_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface ProductProjectionRow {
  id: string;
  title: string;
  price: number;
  active: number;
  updated_at: string;
}
