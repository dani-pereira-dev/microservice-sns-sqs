import { Injectable } from '@nestjs/common';
import {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsRepository } from '../persistence/products.repository';
import {
  requireExistingProduct,
  validateProductPrice,
  validateProductTitle,
  validateUpdateProductInput,
} from './products.domain.validators';

@Injectable()
export class ProductsCommandService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  createProduct(input: CreateProductRequest) {
    validateProductTitle(input.title);
    validateProductPrice(input.price);

    const now = new Date().toISOString();
    const product: Product = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      price: input.price,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.productsRepository.create(product);
  }

  updateProduct(productId: string, input: UpdateProductRequest) {
    validateUpdateProductInput(input);

    const existingProduct = requireExistingProduct(
      this.productsRepository.findById(productId),
      productId,
    );

    const updatedProduct: Product = {
      ...existingProduct,
      title: input.title?.trim() || existingProduct.title,
      price: input.price ?? existingProduct.price,
      active: input.active ?? existingProduct.active,
      updatedAt: new Date().toISOString(),
    };

    return this.productsRepository.save(updatedProduct);
  }
}
