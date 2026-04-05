import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CREATED_EVENT,
  PAYMENT_CONFIRMED_EVENT,
  OrderCreatedEvent,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentsOutboxPublisher } from '../messaging/payments-outbox.publisher';
import { PaymentsRepository } from '../persistence/payments.repository';
import { PaymentsTransactionalRepository } from '../persistence/payments-transactional.repository';
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

    const paymentConfirmation: PaymentConfirmation = {
      idempotencyKey: input.idempotencyKey,
      paymentId: crypto.randomUUID(),
      orderId: input.orderId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    };

    const event = this.buildPaymentConfirmedEvent(paymentConfirmation);
    const topicArn = this.getPaymentConfirmedTopicArn();

    this.paymentsTransactionalRepository.createWithOutbox(
      paymentConfirmation,
      event,
      topicArn,
    );
    void this.paymentsOutboxPublisher.publishPendingEvents();

    return paymentConfirmation;
  }

  private buildPaymentConfirmedEvent(
    payment: PaymentConfirmation,
  ): PaymentConfirmedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: PAYMENT_CONFIRMED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'payments',
      payload: payment,
    };
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
