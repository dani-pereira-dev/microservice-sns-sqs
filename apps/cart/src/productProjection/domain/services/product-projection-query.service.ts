import { Injectable } from '@nestjs/common';
import { ProductProjectionsRepository } from '../../persistence/product-projections.repository';
import { ensureExistingProductProjection } from '../validators/product-projection.domain.validators';

@Injectable()
export class ProductProjectionQueryService {
  constructor(
    private readonly productProjectionsRepository: ProductProjectionsRepository,
  ) {}

  list() {
    return this.productProjectionsRepository.list();
  }

  getById(productId: string) {
    return ensureExistingProductProjection(
      this.productProjectionsRepository.findById(productId),
      productId,
    );
  }
}
