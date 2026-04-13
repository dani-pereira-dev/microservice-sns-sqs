import { Module } from '@nestjs/common';
import { ProductsProjectionDynamoModule } from '../persistence/product-projection/products-projection-dynamo.module';
import { ProductsProjectionSyncService } from './domain/products-projection-sync.service';
import { ProductEventsProjectionConsumer } from './messaging/product-events-projection.consumer';

@Module({
  imports: [ProductsProjectionDynamoModule],
  providers: [ProductsProjectionSyncService, ProductEventsProjectionConsumer],
})
export class ProductsProjectionSyncModule {}
