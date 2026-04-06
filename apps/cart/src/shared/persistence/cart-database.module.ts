import { Module } from '@nestjs/common';
import { CartDatabase } from './cart-database';

@Module({
  providers: [CartDatabase],
  exports: [CartDatabase],
})
export class CartDatabaseModule {}
