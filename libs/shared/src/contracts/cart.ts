export type CartStatus = 'open' | 'checked_out';

export interface CreateCartRequest {
  customerName: string;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productTitleSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  customerName: string;
  status: CartStatus;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  checkedOutOrderId?: string;
}
