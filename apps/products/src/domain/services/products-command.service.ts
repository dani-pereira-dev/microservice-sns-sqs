import { Injectable } from '@nestjs/common';
import {
  PRODUCT_CREATED_EVENT,
  PRODUCT_UPDATED_EVENT,
} from '@shared/contracts/events';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsEventsPublisher } from '../../messaging/products-events.publisher';
import { ProductEventsRepository } from '../../persistence/product-events.repository';
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

@Injectable()
export class ProductsCommandService {
  constructor(
    private readonly productEventsRepository: ProductEventsRepository,
    private readonly productsEventsPublisher: ProductsEventsPublisher,
  ) {}

  async createProduct(input: CreateProductRequest) {
    validateProductTitle(input.title);
    validateProductPrice(input.price);

    const now = new Date().toISOString();
    const product = buildProduct(input, now);

    const version = await this.productEventsRepository.getNextVersion(
      product.id,
    );
    const createdEvent = await this.productEventsRepository.append({
      aggregateId: product.id,
      type: PRODUCT_CREATED_EVENT,
      payload: product,
      version,
    });
    await this.productsEventsPublisher.publishProductCreated(product);
    await this.productEventsRepository.markPublished(createdEvent.id);
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
    const updatedEvent = await this.productEventsRepository.append({
      aggregateId: productId,
      type: PRODUCT_UPDATED_EVENT,
      payload: updatedProduct,
      version,
    });
    await this.productsEventsPublisher.publishProductUpdated(updatedProduct);
    await this.productEventsRepository.markPublished(updatedEvent.id);
    return updatedProduct;
  }
}
