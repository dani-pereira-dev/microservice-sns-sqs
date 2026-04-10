import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Product } from '@shared/contracts/products';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';
import { ProductsDomainLogger } from '../domain/logging/products-domain.logger';
import {
  buildProductCreatedEvent,
  buildProductUpdatedEvent,
} from './builders/products-events.messaging.builders';

@Injectable()
export class ProductsEventsPublisher {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly productsDomainLogger: ProductsDomainLogger,
  ) {}

  private getTopicArn(): string | undefined {
    return this.configService.get('messaging.productEventsTopicArn', {
      infer: true,
    });
  }

  async publishProductCreated(product: Product): Promise<void> {
    const topicArn = this.getTopicArn();
    if (!topicArn) {
      this.productsDomainLogger.warn(
        'AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN is not configured. Skipping product.created publish.',
      );
      return;
    }

    const productCreatedEvent = buildProductCreatedEvent(product);

    await this.messagePublisher.publish({
      topicArn,
      message: productCreatedEvent,
      attributes: {
        eventType: productCreatedEvent.eventType,
        source: productCreatedEvent.source,
      },
    });
  }

  async publishProductUpdated(product: Product): Promise<void> {
    const topicArn = this.getTopicArn();
    if (!topicArn) {
      this.productsDomainLogger.warn(
        'AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN is not configured. Skipping product.updated publish.',
      );
      return;
    }

    const productUpdatedEvent = buildProductUpdatedEvent(product);

    await this.messagePublisher.publish({
      topicArn,
      message: productUpdatedEvent,
      attributes: {
        eventType: productUpdatedEvent.eventType,
        source: productUpdatedEvent.source,
      },
    });
  }
}
