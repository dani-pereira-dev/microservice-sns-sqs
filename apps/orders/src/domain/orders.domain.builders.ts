import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  Order,
  OrderItem,
} from '@shared/contracts/orders';

export const buildOrderItem = (input: CreateOrderItemRequest): OrderItem => ({
  id: crypto.randomUUID(),
  productId: input.productId.trim(),
  productTitleSnapshot: input.productTitleSnapshot.trim(),
  unitPrice: input.unitPrice,
  quantity: input.quantity,
  lineTotal: input.unitPrice * input.quantity,
});

export const buildOrder = (
  input: CreateOrderRequest,
  now: string,
): Order => {
  const items = input.items.map(buildOrderItem);

  return {
    id: crypto.randomUUID(),
    customerName: input.customerName.trim(),
    items,
    amount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    sourceCartId: input.sourceCartId?.trim() || undefined,
  };
};
