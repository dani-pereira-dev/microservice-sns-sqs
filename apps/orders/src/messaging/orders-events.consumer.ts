import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { OrdersEventsPublisher } from './orders-events.publisher';
import { resolveOrderConfirmationFailure } from './orders-events.error-handlers';
import { OrdersDomainLogger } from '../domain/logging/orders-domain.logger';
import { OrdersService } from '../domain/services/orders.service';

@Injectable()
export class OrdersEventsConsumer implements OnModuleInit {
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
      'messaging.ordersPaymentConfirmedQueueUrl',
      {
        infer: true,
      },
    );

    if (!queueUrl) {
      this.ordersDomainLogger.warn(
        'AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL is not configured. Orders consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe<PaymentConfirmedEvent>({
      queueUrl,
      handlerName: 'orders.payment-confirmed',
      handleMessage: async (event) => {
        if (event.eventType !== PAYMENT_CONFIRMED_EVENT) {
          return;
        }

        try {
          const confirmationResult =
            this.ordersService.applyPaymentConfirmation(event.payload);

          if (confirmationResult.alreadyProcessed) {
            return;
          }

          await this.ordersEventsPublisher.publishOrderConfirmed(
            confirmationResult.order,
            event.payload,
          );
        } catch (error) {
          const failure = resolveOrderConfirmationFailure(error);

          if (failure.handled) {
            this.ordersDomainLogger.warn(
              `Order confirmation failed for ${event.payload.orderId}: ${failure.reason}`,
            );

            await this.ordersEventsPublisher.publishOrderConfirmationFailed(
              event.payload,
              failure.reason,
            );
            return;
          }

          throw error;
        }
      },
    });
  }
}
