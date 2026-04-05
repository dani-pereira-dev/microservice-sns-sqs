export interface OrderRow {
  id: string;
  customer_name: string;
  amount: number;
  status: 'pending' | 'confirmed';
  created_at: string;
  updated_at: string;
  source_cart_id: string | null;
  payment_json: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_title_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}
