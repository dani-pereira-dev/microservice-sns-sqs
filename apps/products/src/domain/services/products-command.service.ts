import { Injectable } from '@nestjs/common';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsEventsPublisher } from '../../messaging/products-events.publisher';
import { ProductsRepository } from '../../persistence/products.repository';
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
    private readonly productsRepository: ProductsRepository,
    private readonly productsEventsPublisher: ProductsEventsPublisher,
  ) {}

  async createProduct(input: CreateProductRequest) {
    validateProductTitle(input.title);
    validateProductPrice(input.price);

    const now = new Date().toISOString();
    const product = buildProduct(input, now);

    const saved = this.productsRepository.create(product);
    await this.productsEventsPublisher.publishProductCreated(saved);
    return saved;
  }

  async updateProduct(productId: string, input: UpdateProductRequest) {
    validateUpdateProductInput(input);

    const existingProduct = requireExistingProduct(
      this.productsRepository.findById(productId),
      productId,
    );

    const updatedProduct = buildUpdatedProduct({
      existingProduct,
      input,
      updatedAt: new Date().toISOString(),
    });

    const saved = this.productsRepository.save(updatedProduct);
    await this.productsEventsPublisher.publishProductUpdated(saved);
    return saved;
  }
}
