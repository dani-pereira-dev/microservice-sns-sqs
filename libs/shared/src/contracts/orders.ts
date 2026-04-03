export type OrderStatus = 'pending' | 'confirmed';

export interface CreateOrderItemRequest {
  productId: string;
  productTitleSnapshot: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  items: CreateOrderItemRequest[];
  sourceCartId?: string;
}

export interface OrderPaymentInfo {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  confirmedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitleSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  sourceCartId?: string;
  payment?: OrderPaymentInfo;
}
