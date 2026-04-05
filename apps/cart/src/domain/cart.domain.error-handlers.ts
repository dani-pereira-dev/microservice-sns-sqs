import { Cart } from '@shared/contracts/cart';

export const rollbackCartAfterCheckoutPublishError = (
  cart: Cart,
  previousUpdatedAt: string,
) => {
  cart.status = 'open';
  cart.updatedAt = previousUpdatedAt;

  return cart;
};
