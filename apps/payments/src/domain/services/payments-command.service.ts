import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ORDER_CREATED_EVENT,
  OrderCreatedEvent,
} from "@shared/contracts/events";
import { ServiceConfig } from "@shared/config/service-config.types";
import { PaymentsOutboxRelayService } from "../../messaging/payments-outbox-relay.service";
import { PaymentsCommandRepository } from "../../persistence/payments/payments-command.repository";
import { PaymentsQueryRepository } from "../../persistence/payments/payments-query.repository";
import { buildPaymentConfirmation } from "../builders/payments.domain.builders";
import {
  CreatePaymentAttemptInput,
  ensureIdempotentRequestMatches,
  requirePaymentConfirmedTopicArn,
  validateCreatePaymentAttemptInput,
} from "../validators/payments.domain.validators";

@Injectable()
export class PaymentsCommandService {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsQueryRepository: PaymentsQueryRepository,
    private readonly paymentsCommandRepository: PaymentsCommandRepository,
    private readonly paymentsOutboxRelay: PaymentsOutboxRelayService,
  ) {}

  async confirmPaymentFromOrderCreated(event: OrderCreatedEvent) {
    if (event.eventType !== ORDER_CREATED_EVENT) {
      return;
    }

    await this.confirmPaymentInternal({
      idempotencyKey: event.payload.orderId,
      orderId: event.payload.orderId,
      amount: event.payload.amount,
      paymentMethod: "checkout_auto",
    });
  }

  private async confirmPaymentInternal(input: CreatePaymentAttemptInput) {
    validateCreatePaymentAttemptInput(input);

    const existingPayment =
      await this.paymentsQueryRepository.findPaymentByIdempotencyKey(
        input.idempotencyKey,
      );

    if (existingPayment) {
      ensureIdempotentRequestMatches(existingPayment, input);
      void this.paymentsOutboxRelay.flushPendingOutbox();

      return existingPayment;
    }

    const paymentConfirmation = buildPaymentConfirmation(input);

    requirePaymentConfirmedTopicArn(
      this.configService.get("messaging.paymentConfirmedTopicArn", {
        infer: true,
      }),
    );

    await this.paymentsCommandRepository.createPayment(paymentConfirmation);
    void this.paymentsOutboxRelay.flushPendingOutbox();

    return paymentConfirmation;
  }
}
