import { Injectable } from '@nestjs/common';
import { ProductEventsRepository } from '../../persistence/product-events.repository';
import { requireExistingProduct } from '../validators/products.domain.validators';

/**
 * Lecturas provisionales desde el stream en Postgres (instancia en AWS).
 * Siguiente paso: read model en otra base (p. ej. DynamoDB) sin tocar el event store.
 */
@Injectable()
export class ProductsQueryService {
  constructor(
    private readonly productEventsRepository: ProductEventsRepository,
  ) {}

  listProducts() {
    return this.productEventsRepository.listProducts();
  }

  async getProductById(productId: string) {
    return requireExistingProduct(
      await this.productEventsRepository.findProductById(productId),
      productId,
    );
  }
}
