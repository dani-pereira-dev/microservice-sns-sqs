import {
  Cart,
  CartItem,
  CreateCartRequest,
  UpdateCartItemRequest,
} from '@shared/contracts/cart';
import { CheckoutInitiatedPayload } from '@shared/contracts/events';
import { CartProductProjection } from '../cart-product-projection';

export const buildCart = (
  input: CreateCartRequest,
  now: string,
): Cart => ({
  id: crypto.randomUUID(),
  customerName: input.customerName.trim(),
  status: 'open',
  items: [],
  totalAmount: 0,
  createdAt: now,
  updatedAt: now,
});

export const buildCartItem = ({
  existingItem,
  product,
  quantityToAdd,
}: {
  existingItem?: CartItem | null;
  product: CartProductProjection;
  quantityToAdd: number;
}): CartItem => {
  const quantity = (existingItem?.quantity ?? 0) + quantityToAdd;

  return {
    id: existingItem?.id ?? crypto.randomUUID(),
    productId: product.id,
    productTitleSnapshot: product.title,
    unitPrice: product.price,
    quantity,
    lineTotal: product.price * quantity,
  };
};

export const buildUpdatedCartItem = (
  existingItem: CartItem,
  input: UpdateCartItemRequest,
): CartItem => ({
  ...existingItem,
  quantity: input.quantity,
  lineTotal: existingItem.unitPrice * input.quantity,
});

export const buildCheckoutInitiatedPayload = (
  cart: Cart,
  requestedAt: string,
): CheckoutInitiatedPayload => ({
  checkoutId: crypto.randomUUID(),
  cartId: cart.id,
  customerName: cart.customerName,
  items: cart.items.map((item) => ({
    productId: item.productId,
    productTitleSnapshot: item.productTitleSnapshot,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  })),
  requestedAt,
});
