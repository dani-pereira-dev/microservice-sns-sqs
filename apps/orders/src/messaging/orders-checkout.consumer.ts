import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHECKOUT_INITIATED_EVENT,
  CheckoutInitiatedEvent,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { OrdersEventsPublisher } from './orders-events.publisher';
import { OrdersDomainLogger } from '../domain/logging/orders-domain.logger';
import { OrdersService } from '../domain/services/orders.service';

@Injectable()
export class OrdersCheckoutConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly messageConsumer: MessageConsumer,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly ordersEventsPublisher: OrdersEventsPublisher,
    private readonly ordersService: OrdersService,
    private readonly ordersDomainLogger: OrdersDomainLogger,
  ) {}

  async onModuleInit() {
    const queueUrl = this.configService.get(
      'messaging.ordersCheckoutInitiatedQueueUrl',
      {
        infer: true,
      },
    );

    if (!queueUrl) {
      this.ordersDomainLogger.warn(
        'AWS_SQS_ORDERS_CHECKOUT_INITIATED_QUEUE_URL is not configured. Checkout consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe<CheckoutInitiatedEvent>({
      queueUrl,
      handlerName: 'orders.checkout-initiated',
      handleMessage: async (event) => {
        if (event.eventType !== CHECKOUT_INITIATED_EVENT) {
          return;
        }

        const order = this.ordersService.createOrderFromCheckout(event.payload);

        await this.ordersEventsPublisher.publishOrderCreated(
          order,
          event.payload.checkoutId,
        );
      },
    });
  }
}
