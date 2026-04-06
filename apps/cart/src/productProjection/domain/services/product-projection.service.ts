import { Injectable } from '@nestjs/common';
import { ProductProjectionQueryService } from './product-projection-query.service';

@Injectable()
export class ProductProjectionService {
  constructor(
    private readonly productProjectionQueryService: ProductProjectionQueryService,
  ) {}

  listProductProjections() {
    return this.productProjectionQueryService.list();
  }

  getProductProjectionById(productId: string) {
    return this.productProjectionQueryService.getById(productId);
  }
}
