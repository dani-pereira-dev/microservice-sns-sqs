import { Injectable } from '@nestjs/common';
import { ProductProjectionRepository } from '../../persistence/product-projection/product-projection.repository';
import { requireExistingProduct } from '../validators/products.domain.validators';

@Injectable()
export class ProductsQueryService {
  constructor(
    private readonly productProjectionRepository: ProductProjectionRepository,
  ) {}

  listProducts() {
    return this.productProjectionRepository.listProducts();
  }

  async getProductById(productId: string) {
    return requireExistingProduct(
      await this.productProjectionRepository.findProductById(productId),
      productId,
    );
  }
}
