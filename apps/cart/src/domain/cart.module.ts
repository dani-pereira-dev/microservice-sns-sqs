import { Module } from '@nestjs/common';
import { CartDatabase } from '../persistence/cart-database';
import { CartCheckoutPublisher } from '../messaging/cart-checkout.publisher';
import { CartController } from '../http/cart.controller';
import { CartProductProjectionsRepository } from '../persistence/cart-product-projections.repository';
import { CartRepository } from '../persistence/cart.repository';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController],
  providers: [
    CartDatabase,
    CartRepository,
    CartProductProjectionsRepository,
    CartService,
    CartCheckoutPublisher,
  ],
})
export class CartModule {}
