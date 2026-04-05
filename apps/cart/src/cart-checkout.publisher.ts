import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHECKOUT_INITIATED_EVENT,
  CheckoutInitiatedEvent,
  CheckoutInitiatedPayload,
} from '@shared/contracts/events';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';

@Injectable()
export class CartCheckoutPublisher {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async publishCheckoutInitiated(payload: CheckoutInitiatedPayload) {
    const topicArn = this.configService.get(
      'messaging.checkoutInitiatedTopicArn',
      {
        infer: true,
      },
    );

    if (!topicArn) {
      throw new InternalServerErrorException(
        'AWS_SNS_CHECKOUT_INITIATED_TOPIC_ARN is not configured.',
      );
    }

    const event: CheckoutInitiatedEvent = {
      eventId: crypto.randomUUID(),
      eventType: CHECKOUT_INITIATED_EVENT,
      occurredAt: new Date().toISOString(),
      source: 'cart',
      payload,
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
}
