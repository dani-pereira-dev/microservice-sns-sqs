export type OrderStatus = 'pending' | 'confirmed';

export interface CreateOrderRequest {
  customerName: string;
  product: string;
  amount: number;
}

export interface OrderPaymentInfo {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  confirmedAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  product: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  payment?: OrderPaymentInfo;
}
