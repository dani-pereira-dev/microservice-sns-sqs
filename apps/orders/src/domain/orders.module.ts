import { Module } from '@nestjs/common';
import { OrdersCheckoutConsumer } from '../messaging/orders-checkout.consumer';
import { OrdersEventsPublisher } from '../messaging/orders-events.publisher';
import { OrdersController } from '../http/orders.controller';
import { OrdersEventsConsumer } from '../messaging/orders-events.consumer';
import { OrdersRepository } from '../persistence/orders.repository';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersRepository,
    OrdersService,
    OrdersCheckoutConsumer,
    OrdersEventsConsumer,
    OrdersEventsPublisher,
  ],
})
export class OrdersModule {}
