import { Module } from '@nestjs/common';
import { OrdersClient } from './orders.client';
import { PaymentsController } from './payments.controller';
import { PaymentsOutboxPublisher } from './payments-outbox.publisher';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    OrdersClient,
    PaymentsRepository,
    PaymentsService,
    PaymentsOutboxPublisher,
  ],
})
export class PaymentsModule {}
