import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CREATED_EVENT,
  ORDER_CONFIRMED_EVENT,
  ORDER_CONFIRMATION_FAILED_EVENT,
  OrderCreatedEvent,
  OrderConfirmationFailedEvent,
  OrderConfirmedEvent,
} from '@shared/contracts/events';
import { Order } from '@shared/contracts/orders';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';

@Injectable()
export class OrdersEventsPublisher {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async publishOrderCreated(order: Order, checkoutId?: string) {
    const event: OrderCreatedEvent = {
      eventId: crypto.randomUUID(),
      eventType: ORDER_CREATED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'orders',
      payload: {
        checkoutId,
        orderId: order.id,
        customerName: order.customerName,
        items: order.items,
        amount: order.amount,
        sourceCartId: order.sourceCartId,
        createdAt: order.createdAt,
      },
    };

    await this.publishOrderCreatedEvent(event);
  }

  async publishOrderConfirmed(order: Order, payment: PaymentConfirmation) {
    const persistedPayment = order.payment;

    if (!persistedPayment) {
      throw new InternalServerErrorException(
        `Order ${order.id} has no payment info to publish order.confirmed.`,
      );
    }

    const event: OrderConfirmedEvent = {
      eventId: crypto.randomUUID(),
      eventType: ORDER_CONFIRMED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'orders',
      payload: {
        orderId: order.id,
        customerName: order.customerName,
        amount: order.amount,
        confirmedAt: persistedPayment.confirmedAt,
        payment,
      },
    };

    await this.publishOrderStatus(event);
  }

  async publishOrderConfirmationFailed(
    payment: PaymentConfirmation,
    reason: string,
  ) {
    const event: OrderConfirmationFailedEvent = {
      eventId: crypto.randomUUID(),
      eventType: ORDER_CONFIRMATION_FAILED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'orders',
      payload: {
        orderId: payment.orderId,
        payment,
        reason,
        failedAt: new Date().toISOString(),
      },
    };

    await this.publishOrderStatus(event);
  }

  private async publishOrderCreatedEvent(event: OrderCreatedEvent) {
    const topicArn = this.configService.get('messaging.orderCreatedTopicArn', {
      infer: true,
    });

    if (!topicArn) {
      throw new InternalServerErrorException(
        'AWS_SNS_ORDER_CREATED_TOPIC_ARN is not configured.',
      );
    }

    await this.messagePublisher.publish({
      topicArn,
      message: event,
      attributes: {
        eventType: event.eventType,
        source: event.source,
      },
    });
  }

  private async publishOrderStatus<
    TEvent extends OrderConfirmedEvent | OrderConfirmationFailedEvent,
  >(event: TEvent) {
    const topicArn = this.configService.get('messaging.orderStatusTopicArn', {
      infer: true,
    });

    if (!topicArn) {
      throw new InternalServerErrorException(
        'AWS_SNS_ORDER_STATUS_TOPIC_ARN is not configured.',
      );
    }

    await this.messagePublisher.publish({
      topicArn,
      message: event,
      attributes: {
        eventType: event.eventType,
        source: event.source,
      },
    });
  }
}
