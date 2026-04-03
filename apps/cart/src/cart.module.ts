import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';
import { OrdersClient } from './orders.client';
import { ProductsClient } from './products.client';

@Module({
  controllers: [CartController],
  providers: [
    CartRepository,
    CartService,
    ProductsClient,
    OrdersClient,
  ],
})
export class CartModule {}
