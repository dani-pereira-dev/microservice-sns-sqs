import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentsEventsConsumer } from "../messaging/payments-events.consumer";
import { PaymentsController } from "../http/payments.controller";
import { PaymentsOutboxRelayService } from "../messaging/payments-outbox-relay.service";
import { Payment } from "../persistence/payments/payment.entity";
import { PaymentsCommandRepository } from "../persistence/payments/payments-command.repository";
import { PaymentsQueryRepository } from "../persistence/payments/payments-query.repository";
import { PaymentsDomainLogger } from "./logging/payments-domain.logger";
import { PaymentsCommandService } from "./services/payments-command.service";
import { PaymentsQueryService } from "./services/payments-query.service";
import { PaymentsService } from "./services/payments.service";

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [
    PaymentsDomainLogger,
    PaymentsEventsConsumer,
    PaymentsQueryRepository,
    PaymentsCommandRepository,
    PaymentsQueryService,
    PaymentsCommandService,
    PaymentsService,
    PaymentsOutboxRelayService,
  ],
})
export class PaymentsModule {}
