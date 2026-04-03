import {
  BadRequestException,
  ConflictException,
  Inject,
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
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  listPayments() {
    return this.paymentsRepository.list();
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

      return {
        status: 'accepted',
        message:
          'Payment request already processed for this idempotency key. Returning stored result without republishing the event.',
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

    this.paymentsRepository.create(paymentConfirmation);
    const event = await this.publishPaymentConfirmedEvent(paymentConfirmation);

    return {
      status: 'accepted',
      message:
        'Payment confirmed in payments and event published. Order confirmation will continue asynchronously.',
      payment: paymentConfirmation,
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
      },
      orderProcessing: {
        status: 'pending_async_confirmation',
      },
      idempotency: {
        replayed: false,
      },
    };
  }

  private async publishPaymentConfirmedEvent(
    payment: PaymentConfirmation,
  ): Promise<PaymentConfirmedEvent> {
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

    const event: PaymentConfirmedEvent = {
      eventId: crypto.randomUUID(),
      eventType: PAYMENT_CONFIRMED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'payments',
      payload: payment,
    };

    await this.messagePublisher.publish({
      topicArn,
      message: event,
      attributes: {
        eventType: event.eventType,
        source: event.source,
      },
    });

    return event;
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
