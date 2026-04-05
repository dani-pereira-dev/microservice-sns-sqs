import { Module } from '@nestjs/common';
import { CartDatabase } from '../persistence/cart-database';
import { CartCheckoutPublisher } from '../messaging/cart-checkout.publisher';
import { CartController } from '../http/cart.controller';
import { CartProductProjectionsRepository } from '../persistence/cart-product-projections.repository';
import { CartRepository } from '../persistence/cart.repository';
import { CartDomainLogger } from './logging/cart-domain.logger';
import { CartCommandService } from './services/cart-command.service';
import { CartQueryService } from './services/cart-query.service';
import { CartService } from './services/cart.service';

@Module({
  controllers: [CartController],
  providers: [
    CartDomainLogger,
    CartDatabase,
    CartRepository,
    CartProductProjectionsRepository,
    CartQueryService,
    CartCommandService,
    CartService,
    CartCheckoutPublisher,
  ],
})
export class CartModule {}
