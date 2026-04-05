import { Module } from '@nestjs/common';
import { ProductsController } from '../http/products.controller';
import { ProductsRepository } from '../persistence/products.repository';
import { ProductsDomainLogger } from './logging/products-domain.logger';
import { ProductsCommandService } from './services/products-command.service';
import { ProductsQueryService } from './services/products-query.service';
import { ProductsService } from './services/products.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsDomainLogger,
    ProductsRepository,
    ProductsQueryService,
    ProductsCommandService,
    ProductsService,
  ],
})
export class ProductsModule {}
