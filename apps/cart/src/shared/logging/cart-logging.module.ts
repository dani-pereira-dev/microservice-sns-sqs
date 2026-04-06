import { Module } from '@nestjs/common';
import { CartDomainLogger } from './cart-domain.logger';

@Module({
  providers: [CartDomainLogger],
  exports: [CartDomainLogger],
})
export class CartLoggingModule {}
