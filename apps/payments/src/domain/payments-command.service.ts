import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CREATED_EVENT,
  OrderCreatedEvent,
} from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentsOutboxPublisher } from '../messaging/payments-outbox.publisher';
import { PaymentsRepository } from '../persistence/payments.repository';
import { PaymentsTransactionalRepository } from '../persistence/payments-transactional.repository';
import {
  buildPaymentConfirmation,
  buildPaymentConfirmedEvent,
} from './payments.domain.builders';
import {
  CreatePaymentAttemptInput,
  ensureIdempotentRequestMatches,
  requirePaymentConfirmedTopicArn,
  validateCreatePaymentAttemptInput,
} from './payments.domain.validators';

@Injectable()
export class PaymentsCommandService {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentsTransactionalRepository: PaymentsTransactionalRepository,
    private readonly paymentsOutboxPublisher: PaymentsOutboxPublisher,
  ) {}

  async confirmPaymentFromOrderCreated(event: OrderCreatedEvent) {
    if (event.eventType !== ORDER_CREATED_EVENT) {
      return;
    }

    await this.confirmPaymentInternal({
      idempotencyKey: event.payload.orderId,
      orderId: event.payload.orderId,
      amount: event.payload.amount,
      paymentMethod: 'checkout_auto',
    });
  }

  private async confirmPaymentInternal(input: CreatePaymentAttemptInput) {
    validateCreatePaymentAttemptInput(input);

    const existingPayment = this.paymentsRepository.findByIdempotencyKey(
      input.idempotencyKey,
    );

    if (existingPayment) {
      ensureIdempotentRequestMatches(existingPayment, input);
      void this.paymentsOutboxPublisher.publishPendingEvents();

      return existingPayment;
    }

    const paymentConfirmation: PaymentConfirmation =
      buildPaymentConfirmation(input);
    const event = buildPaymentConfirmedEvent(paymentConfirmation);
    const topicArn = this.getPaymentConfirmedTopicArn();

    this.paymentsTransactionalRepository.createWithOutbox(
      paymentConfirmation,
      event,
      topicArn,
    );
    void this.paymentsOutboxPublisher.publishPendingEvents();

    return paymentConfirmation;
  }

  private getPaymentConfirmedTopicArn() {
    return requirePaymentConfirmedTopicArn(
      this.configService.get(
      'messaging.paymentConfirmedTopicArn',
      {
        infer: true,
      },
      ),
    );
  }
}
