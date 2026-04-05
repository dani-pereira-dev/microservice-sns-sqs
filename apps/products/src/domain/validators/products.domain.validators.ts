import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateProductRequest, Product } from '@shared/contracts/products';

export const validateProductTitle = (title: string | undefined) => {
  if (!title?.trim()) {
    throw new BadRequestException('title is required.');
  }
};

export const validateProductPrice = (price: number | undefined) => {
  if (typeof price !== 'number' || price <= 0) {
    throw new BadRequestException('price must be a number greater than 0.');
  }
};

export const validateUpdateProductInput = (input: UpdateProductRequest) => {
  if (input.title !== undefined && !input.title.trim()) {
    throw new BadRequestException('title cannot be empty.');
  }

  if (
    input.price !== undefined &&
    (typeof input.price !== 'number' || input.price <= 0)
  ) {
    throw new BadRequestException('price must be a number greater than 0.');
  }
};

export const requireExistingProduct = (
  product: Product | null,
  productId: string,
) => {
  if (!product) {
    throw new NotFoundException(`Product ${productId} not found.`);
  }

  return product;
};
