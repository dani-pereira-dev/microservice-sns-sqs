import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_CONFIRMATION_FAILED_EVENT,
  ORDER_CONFIRMED_EVENT,
  OrderStatusEvent,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { NotificationService } from '../domain/services/notification.service';

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
      'messaging.notificationOrderStatusQueueUrl',
      {
        infer: true,
      },
    );

    if (!queueUrl) {
      this.logger.warn(
        'AWS_SQS_NOTIFICATION_ORDER_STATUS_QUEUE_URL is not configured. Notification consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe<OrderStatusEvent>({
      queueUrl,
      handlerName: 'notification.order-status',
      handleMessage: async (event) => {
        if (
          event.eventType !== ORDER_CONFIRMED_EVENT &&
          event.eventType !== ORDER_CONFIRMATION_FAILED_EVENT
        ) {
          return;
        }

        await this.notificationService.handleOrderStatus(event);
      },
    });
  }
}
