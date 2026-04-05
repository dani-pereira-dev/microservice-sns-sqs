import { Module } from '@nestjs/common';
import { PaymentsEventsConsumer } from './payments-events.consumer';
import { PaymentsController } from './payments.controller';
import { PaymentsOutboxPublisher } from './payments-outbox.publisher';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsEventsConsumer,
    PaymentsRepository,
    PaymentsService,
    PaymentsOutboxPublisher,
  ],
})
export class PaymentsModule {}
