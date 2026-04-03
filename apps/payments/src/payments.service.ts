import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import {
  ConfirmPaymentRequest,
  PaymentConfirmation,
} from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentsOutboxPublisher } from './payments-outbox.publisher';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentsOutboxPublisher: PaymentsOutboxPublisher,
  ) {}

  listPayments() {
    return this.paymentsRepository.list();
  }

  listOutboxEvents() {
    return this.paymentsRepository.listOutboxEvents();
  }

  getPaymentById(paymentId: string) {
    const payment = this.paymentsRepository.findByPaymentId(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    return payment;
  }

  async confirmPayment(input: ConfirmPaymentRequest) {
    this.validateConfirmPaymentInput(input);

    const normalizedInput = {
      idempotencyKey: input.idempotencyKey.trim(),
      orderId: input.orderId.trim(),
      amount: input.amount,
      paymentMethod: input.paymentMethod.trim(),
    };

    const existingPayment = this.paymentsRepository.findByIdempotencyKey(
      normalizedInput.idempotencyKey,
    );

    if (existingPayment) {
      this.ensureIdempotentRequestMatches(existingPayment, normalizedInput);
      void this.paymentsOutboxPublisher.publishPendingEvents();

      return {
        status: 'accepted',
        message:
          'Payment request already processed for this idempotency key. Returning stored result and keeping the outbox publication flow active.',
        payment: existingPayment,
        event: null,
        orderProcessing: {
          status: 'already_requested',
        },
        idempotency: {
          replayed: true,
        },
      };
    }

    const paymentConfirmation: PaymentConfirmation = {
      idempotencyKey: normalizedInput.idempotencyKey,
      paymentId: crypto.randomUUID(),
      orderId: normalizedInput.orderId,
      amount: normalizedInput.amount,
      paymentMethod: normalizedInput.paymentMethod,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    };

    const event = this.buildPaymentConfirmedEvent(paymentConfirmation);
    const topicArn = this.getPaymentConfirmedTopicArn();

    this.paymentsRepository.createWithOutbox(paymentConfirmation, event, topicArn);
    void this.paymentsOutboxPublisher.publishPendingEvents();

    return {
      status: 'accepted',
      message:
        'Payment confirmed in payments and event queued in the outbox. Order confirmation will continue asynchronously.',
      payment: paymentConfirmation,
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        publicationStatus: 'pending',
      },
      orderProcessing: {
        status: 'pending_async_confirmation',
      },
      idempotency: {
        replayed: false,
      },
    };
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

  private validateConfirmPaymentInput(input: ConfirmPaymentRequest) {
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
    input: ConfirmPaymentRequest,
  ) {
    if (existingPayment.orderId !== input.orderId) {
      throw new ConflictException(
        'idempotencyKey already used with a different orderId.',
      );
    }

    if (existingPayment.amount !== input.amount) {
      throw new ConflictException(
        'idempotencyKey already used with a different amount.',
      );
    }

    if (existingPayment.paymentMethod !== input.paymentMethod) {
      throw new ConflictException(
        'idempotencyKey already used with a different paymentMethod.',
      );
    }
  }
}
