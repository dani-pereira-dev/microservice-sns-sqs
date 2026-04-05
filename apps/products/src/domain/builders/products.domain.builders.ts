import {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '@shared/contracts/products';

export const buildProduct = (
  input: CreateProductRequest,
  now: string,
): Product => ({
  id: crypto.randomUUID(),
  title: input.title.trim(),
  price: input.price,
  active: true,
  createdAt: now,
  updatedAt: now,
});

export const buildUpdatedProduct = ({
  existingProduct,
  input,
  updatedAt,
}: {
  existingProduct: Product;
  input: UpdateProductRequest;
  updatedAt: string;
}): Product => ({
  ...existingProduct,
  title: input.title?.trim() || existingProduct.title,
  price: input.price ?? existingProduct.price,
  active: input.active ?? existingProduct.active,
  updatedAt,
});
