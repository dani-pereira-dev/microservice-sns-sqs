import { Module } from '@nestjs/common';
import { CartLoggingModule } from '../../shared/logging/cart-logging.module';
import { CartDatabaseModule } from '../../shared/persistence/cart-database.module';
import { ProductProjectionModule } from '../../productProjection/domain/product-projection.module';
import { CartCheckoutPublisher } from '../messaging/cart-checkout.publisher';
import { CartController } from '../http/cart.controller';
import { CartRepository } from '../persistence/cart.repository';
import { CartCommandService } from './services/cart-command.service';
import { CartQueryService } from './services/cart-query.service';
import { CartService } from './services/cart.service';

@Module({
  imports: [
    CartDatabaseModule,
    CartLoggingModule,
    ProductProjectionModule,
  ],
  controllers: [CartController],
  providers: [
    CartRepository,
    CartQueryService,
    CartCommandService,
    CartService,
    CartCheckoutPublisher,
  ],
})
export class CartModule {}
