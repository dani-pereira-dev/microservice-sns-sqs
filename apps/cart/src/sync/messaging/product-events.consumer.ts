import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { CartDomainLogger } from '../../shared/logging/cart-domain.logger';
import { ProductProjectionSyncService } from '../domain/services/product-projection-sync.service';

@Injectable()
export class ProductEventsConsumer implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly messageConsumer: MessageConsumer,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly productProjectionSyncService: ProductProjectionSyncService,
    private readonly cartDomainLogger: CartDomainLogger,
  ) {}

  async onModuleInit() {
    const cartProductEventsQueueUrl = this.configService.get(
      'messaging.cartProductEventsQueueUrl',
      {
        infer: true,
      },
    );

    if (!cartProductEventsQueueUrl) {
      this.cartDomainLogger.warn(
        'AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL is not configured. Product projection sync consumer disabled.',
      );
      return;
    }

    await this.messageConsumer.subscribe({
      queueUrl: cartProductEventsQueueUrl,
      handlerName: 'cart.product-lifecycle',
      handleMessage: async (deserializedMessageBody) => {
        this.productProjectionSyncService.applyLifecycleEvent(
          deserializedMessageBody,
        );
      },
    });
  }
}
