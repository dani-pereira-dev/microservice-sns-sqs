import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';
import { OrdersClient } from './orders.client';

@Module({
  controllers: [CartController],
  providers: [CartRepository, CartService, OrdersClient],
})
export class CartModule {}
