import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Cart } from '@shared/contracts/cart';
import { CartProductProjection } from '../cart-product-projection';

export const validateCreateCartInput = (customerName: string | undefined) => {
  if (!customerName?.trim()) {
    throw new BadRequestException('customerName is required.');
  }
};

export const validateCartItemQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BadRequestException(
      'quantity must be an integer greater than 0.',
    );
  }
};

export const ensureCartIsOpen = (cart: Cart) => {
  if (cart.status !== 'open') {
    throw new BadRequestException(`Cart ${cart.id} is not open.`);
  }

  return cart;
};

export const ensureCartHasItemsForCheckout = (cart: Cart) => {
  if (cart.items.length === 0) {
    throw new BadRequestException('Cart must contain at least one item.');
  }
};

export const ensureExistingCart = (cart: Cart | null, cartId: string) => {
  if (!cart) {
    throw new NotFoundException(`Cart ${cartId} not found.`);
  }

  return cart;
};

export const ensureExistingCartItem = <TItem>(item: TItem | null, itemId: string) => {
  if (!item) {
    throw new NotFoundException(`Cart item ${itemId} not found.`);
  }

  return item;
};

export const ensureExistingProductProjection = (
  productProjection: CartProductProjection | null,
  productId: string,
) => {
  if (!productProjection) {
    throw new NotFoundException(
      `Product projection ${productId} not found in cart.`,
    );
  }

  return productProjection;
};

export const ensureProductProjectionIsActive = (
  productProjection: CartProductProjection,
  productId: string,
) => {
  if (!productProjection.active) {
    throw new BadRequestException(
      `Product projection ${productId} is not active in cart.`,
    );
  }

  return productProjection;
};
