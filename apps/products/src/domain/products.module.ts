import { Module } from '@nestjs/common';
import { ProductsController } from '../http/products.controller';
import { ProductsRepository } from '../persistence/products.repository';
import { ProductsCommandService } from './products-command.service';
import { ProductsQueryService } from './products-query.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsRepository,
    ProductsQueryService,
    ProductsCommandService,
    ProductsService,
  ],
})
export class ProductsModule {}
