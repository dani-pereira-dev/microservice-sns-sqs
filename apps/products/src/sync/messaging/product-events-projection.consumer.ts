import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGE_CONSUMER } from '@shared/messaging/messaging.constants';
import { MessageConsumer } from '@shared/messaging/messaging.interfaces';
import { ProductsProjectionSyncService } from '../domain/products-projection-sync.service';

@Injectable()
export class ProductEventsProjectionConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProductEventsProjectionConsumer.name);

  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly messageConsumer: MessageConsumer,
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly productsProjectionSyncService: ProductsProjectionSyncService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueUrl = this.configService.get(
      'messaging.productsProjectionQueueUrl',
      { infer: true },
    );

    if (!queueUrl) {
      this.logger.warn(
        'AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL no está configurada. Consumer de proyección Dynamo deshabilitado.',
      );
      return;
    }

    await this.messageConsumer.subscribe({
      queueUrl,
      handlerName: 'products.projection-dynamo',
      handleMessage: async (deserializedMessageBody) => {
        await this.productsProjectionSyncService.applyLifecycleEvent(
          deserializedMessageBody,
        );
      },
    });
  }
}
