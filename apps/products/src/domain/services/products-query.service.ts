import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '../../persistence/products.repository';
import { requireExistingProduct } from '../validators/products.domain.validators';

@Injectable()
export class ProductsQueryService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  listProducts() {
    return this.productsRepository.list();
  }

  getProductById(productId: string) {
    return requireExistingProduct(
      this.productsRepository.findById(productId),
      productId,
    );
  }
}
