import { Module } from '@nestjs/common';
import { CartDatabaseModule } from '../../shared/persistence/cart-database.module';
import { ProductProjectionQueryService } from './services/product-projection-query.service';
import { ProductProjectionService } from './services/product-projection.service';
import { ProductProjectionsController } from '../http/product-projections.controller';
import { ProductProjectionsRepository } from '../persistence/product-projections.repository';

@Module({
  imports: [CartDatabaseModule],
  controllers: [ProductProjectionsController],
  providers: [
    ProductProjectionsRepository,
    ProductProjectionQueryService,
    ProductProjectionService,
  ],
  exports: [
    ProductProjectionsRepository,
    ProductProjectionQueryService,
    ProductProjectionService,
  ],
})
export class ProductProjectionModule {}
