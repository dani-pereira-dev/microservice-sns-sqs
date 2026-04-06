import { Controller, Get, Param } from '@nestjs/common';
import { ProductProjectionService } from '../domain/services/product-projection.service';

@Controller('product-projections')
export class ProductProjectionsController {
  constructor(
    private readonly productProjectionService: ProductProjectionService,
  ) {}

  @Get()
  listProductProjections() {
    return this.productProjectionService.listProductProjections();
  }

  @Get(':productId')
  getProductProjectionById(@Param('productId') productId: string) {
    return this.productProjectionService.getProductProjectionById(productId);
  }
}
