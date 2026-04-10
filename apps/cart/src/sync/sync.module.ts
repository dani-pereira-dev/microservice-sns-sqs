import { Module } from '@nestjs/common';
import { ProductProjectionModule } from '../productProjection/domain/product-projection.module';
import { CartLoggingModule } from '../shared/logging/cart-logging.module';
import { ProductProjectionSyncService } from './domain/services/product-projection-sync.service';
import { ProductEventsConsumer } from './messaging/product-events.consumer';

@Module({
  imports: [CartLoggingModule, ProductProjectionModule],
  providers: [ProductProjectionSyncService, ProductEventsConsumer],
})
export class SyncModule {}
