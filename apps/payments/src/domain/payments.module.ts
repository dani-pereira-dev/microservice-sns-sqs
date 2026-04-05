import { Module } from '@nestjs/common';
import { PaymentsDatabase } from '../persistence/payments-database';
import { PaymentsEventsConsumer } from '../messaging/payments-events.consumer';
import { PaymentsController } from '../http/payments.controller';
import { PaymentsOutboxPublisher } from '../messaging/payments-outbox.publisher';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';
import { PaymentsRepository } from '../persistence/payments.repository';
import { PaymentsTransactionalRepository } from '../persistence/payments-transactional.repository';
import { PaymentsCommandService } from './services/payments-command.service';
import { PaymentsQueryService } from './services/payments-query.service';
import { PaymentsService } from './services/payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsDatabase,
    PaymentsEventsConsumer,
    PaymentsOutboxRepository,
    PaymentsRepository,
    PaymentsTransactionalRepository,
    PaymentsQueryService,
    PaymentsCommandService,
    PaymentsService,
    PaymentsOutboxPublisher,
  ],
})
export class PaymentsModule {}
