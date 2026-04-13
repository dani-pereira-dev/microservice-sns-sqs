import { Injectable } from '@nestjs/common';
import {
  PRODUCT_CREATED_EVENT,
  PRODUCT_UPDATED_EVENT,
} from '@shared/contracts/events';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductEventsRepository } from '../../persistence/product-events/product-events.repository';
import {
  buildProduct,
  buildUpdatedProduct,
} from '../builders/products.domain.builders';
import {
  requireExistingProduct,
  validateProductPrice,
  validateProductTitle,
  validateUpdateProductInput,
} from '../validators/products.domain.validators';

/**
 * Solo persiste en el event store (`published_at` null). La publicación a SNS la hace
 * `ProductsOutboxRelayService` por polling.
 */
@Injectable()
export class ProductsCommandService {
  constructor(
    private readonly productEventsRepository: ProductEventsRepository,
  ) {}

  async createProduct(input: CreateProductRequest) {
    validateProductTitle(input.title);
    validateProductPrice(input.price);

    const now = new Date().toISOString();
    const product = buildProduct(input, now);

    const version = await this.productEventsRepository.getNextVersion(
      product.id,
    );
    await this.productEventsRepository.append({
      aggregateId: product.id,
      type: PRODUCT_CREATED_EVENT,
      payload: product,
      version,
    });
    return product;
  }

  async updateProduct(productId: string, input: UpdateProductRequest) {
    validateUpdateProductInput(input);

    const existingProduct = requireExistingProduct(
      await this.productEventsRepository.findProductById(productId),
      productId,
    );

    const updatedProduct = buildUpdatedProduct({
      existingProduct,
      input,
      updatedAt: new Date().toISOString(),
    });

    const version = await this.productEventsRepository.getNextVersion(
      productId,
    );
    await this.productEventsRepository.append({
      aggregateId: productId,
      type: PRODUCT_UPDATED_EVENT,
      payload: updatedProduct,
      version,
    });
    return updatedProduct;
  }
}
