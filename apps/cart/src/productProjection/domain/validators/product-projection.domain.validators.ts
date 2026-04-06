import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductProjection } from '../product-projection.model';

export const ensureExistingProductProjection = (
  productProjection: ProductProjection | null,
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
  productProjection: ProductProjection,
  productId: string,
) => {
  if (!productProjection.active) {
    throw new BadRequestException(
      `Product projection ${productId} is not active in cart.`,
    );
  }

  return productProjection;
};
