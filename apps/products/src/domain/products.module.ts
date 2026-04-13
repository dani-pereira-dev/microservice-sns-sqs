import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsProjectionDynamoModule } from '../persistence/product-projection/products-projection-dynamo.module';
import { ProductsController } from '../http/products.controller';
import { ProductsOutboxRelayService } from '../messaging/products-outbox-relay.service';
import { ProductsEventsPublisher } from '../messaging/products-events.publisher';
import { ProductEvent } from '../persistence/product-events/product-event.entity';
import { ProductEventsRepository } from '../persistence/product-events/product-events.repository';
import { ProductsDomainLogger } from './logging/products-domain.logger';
import { ProductsCommandService } from './services/products-command.service';
import { ProductsQueryService } from './services/products-query.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEvent]),
    ProductsProjectionDynamoModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsDomainLogger,
    ProductEventsRepository,
    ProductsQueryService,
    ProductsCommandService,
    ProductsService,
    ProductsEventsPublisher,
    ProductsOutboxRelayService,
  ],
})
export class ProductsModule {}
