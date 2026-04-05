import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CREATED_EVENT,
  PAYMENT_CONFIRMED_EVENT,
  OrderCreatedEvent,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';
import { PaymentsOutboxPublisher } from '../messaging/payments-outbox.publisher';
import { PaymentsRepository } from '../persistence/payments.repository';
import { PaymentsTransactionalRepository } from '../persistence/payments-transactional.repository';

interface CreatePaymentAttemptInput {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentsOutboxRepository: PaymentsOutboxRepository,
    private readonly paymentsTransactionalRepository: PaymentsTransactionalRepository,
    private readonly paymentsOutboxPublisher: PaymentsOutboxPublisher,
  ) {}

  listPayments() {
    return this.paymentsRepository.list();
  }

  listOutboxEvents() {
    return this.paymentsOutboxRepository.listOutboxEvents();
  }

  getPaymentById(paymentId: string) {
    const payment = this.paymentsRepository.findByPaymentId(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    return payment;
  }

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
    this.validateCreatePaymentAttemptInput(input);

    const existingPayment = this.paymentsRepository.findByIdempotencyKey(
      input.idempotencyKey,
    );

    if (existingPayment) {
      this.ensureIdempotentRequestMatches(existingPayment, input);
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
    const topicArn = this.configService.get(
      'messaging.paymentConfirmedTopicArn',
      {
        infer: true,
      },
    );

    if (!topicArn) {
      throw new BadRequestException(
        'AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN is not configured.',
      );
    }

    return topicArn;
  }

  private validateCreatePaymentAttemptInput(input: CreatePaymentAttemptInput) {
    if (!input.idempotencyKey?.trim()) {
      throw new BadRequestException('idempotencyKey is required.');
    }

    if (!input.orderId?.trim()) {
      throw new BadRequestException('orderId is required.');
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new BadRequestException('amount must be a number greater than 0.');
    }

    if (!input.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }
  }

  private ensureIdempotentRequestMatches(
    existingPayment: PaymentConfirmation,
    input: CreatePaymentAttemptInput,
  ) {
    if (existingPayment.orderId !== input.orderId) {
      throw new ConflictException(
        'idempotencyKey already used with a different orderId.',
      );
    }

    if (existingPayment.paymentMethod !== input.paymentMethod) {
      throw new ConflictException(
        'idempotencyKey already used with a different paymentMethod.',
      );
    }

    if (existingPayment.amount !== input.amount) {
      throw new ConflictException(
        'idempotencyKey already used with a different amount.',
      );
    }
  }
}
