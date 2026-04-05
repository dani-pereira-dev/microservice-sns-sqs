import { Module } from '@nestjs/common';
import { OrdersCheckoutConsumer } from '../messaging/orders-checkout.consumer';
import { OrdersEventsPublisher } from '../messaging/orders-events.publisher';
import { OrdersController } from '../http/orders.controller';
import { OrdersEventsConsumer } from '../messaging/orders-events.consumer';
import { OrdersRepository } from '../persistence/orders.repository';
import { OrdersCommandService } from './orders-command.service';
import { OrdersQueryService } from './orders-query.service';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersRepository,
    OrdersQueryService,
    OrdersCommandService,
    OrdersService,
    OrdersCheckoutConsumer,
    OrdersEventsConsumer,
    OrdersEventsPublisher,
  ],
})
export class OrdersModule {}
