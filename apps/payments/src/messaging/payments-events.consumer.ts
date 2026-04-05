import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CREATED_EVENT,
  OrderCreatedEvent,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { PaymentsDomainLogger } from '../domain/logging/payments-domain.logger';
import { PaymentsService } from '../domain/services/payments.service';

@Injectable()
export class PaymentsEventsConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly messageConsumer: MessageConsumer,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsService: PaymentsService,
    private readonly paymentsDomainLogger: PaymentsDomainLogger,
  ) {}

  async onModuleInit() {
    const queueUrl = this.configService.get(
      'messaging.paymentsOrderCreatedQueueUrl',
      {
        infer: true,
      },
    );

    if (!queueUrl) {
      this.paymentsDomainLogger.warn(
        'AWS_SQS_PAYMENTS_ORDER_CREATED_QUEUE_URL is not configured. Payments consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe<OrderCreatedEvent>({
      queueUrl,
      handlerName: 'payments.order-created',
      handleMessage: async (event) => {
        if (event.eventType !== ORDER_CREATED_EVENT) {
          return;
        }

        await this.paymentsService.confirmPaymentFromOrderCreated(event);
      },
    });
  }
}
