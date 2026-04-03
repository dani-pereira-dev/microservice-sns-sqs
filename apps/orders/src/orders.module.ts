import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersEventsConsumer } from './orders-events.consumer';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, OrdersEventsConsumer],
})
export class OrdersModule {}
