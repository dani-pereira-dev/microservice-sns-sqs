import { Module } from '@nestjs/common';
import { ProductsController } from '../http/products.controller';
import { ProductsRepository } from '../persistence/products.repository';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService],
})
export class ProductsModule {}
