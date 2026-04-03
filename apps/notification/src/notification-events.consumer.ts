import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventsConsumer.name);

  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly messageConsumer: MessageConsumer,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const queueUrl = this.configService.get(
      'messaging.notificationPaymentConfirmedQueueUrl',
      {
        infer: true,
      },
    );

    if (!queueUrl) {
      this.logger.warn(
        'AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL is not configured. Notification consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe<PaymentConfirmedEvent>({
      queueUrl,
      handlerName: 'notification.payment-confirmed',
      handleMessage: async (event) => {
        if (event.eventType !== PAYMENT_CONFIRMED_EVENT) {
          return;
        }

        await this.notificationService.handlePaymentConfirmed(event.payload);
      },
    });
  }
}
