import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async confirmPayment(input: ConfirmPaymentRequest) {
    this.validateConfirmPaymentInput(input);

    const paymentConfirmation: PaymentConfirmation = {
      paymentId: crypto.randomUUID(),
      orderId: input.orderId,
      amount: input.amount,
      paymentMethod: input.paymentMethod.trim(),
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    };

    const event = await this.publishPaymentConfirmedEvent(paymentConfirmation);

    return {
      status: 'accepted',
      payment: paymentConfirmation,
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
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
}
