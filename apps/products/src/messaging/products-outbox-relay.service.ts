import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PRODUCT_CREATED_EVENT,
  PRODUCT_UPDATED_EVENT,
} from '@shared/contracts/events';
import { Product } from '@shared/contracts/products';
import { ServiceConfig } from '@shared/config/service-config.types';
import { ProductEvent } from '../persistence/entities/product-event.entity';
import { ProductEventsRepository } from '../persistence/product-events.repository';
import { ProductsEventsPublisher } from './products-events.publisher';

const OUTBOX_BATCH_SIZE = 50;

/**
 * Reintenta publicación a SNS de eventos con `published_at` null (fallo tras append o caída a mitad de flujo).
 */
@Injectable()
export class ProductsOutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductsOutboxRelayService.name);
  private timer?: NodeJS.Timeout;
  private flushInProgress = false;

  constructor(
    private readonly productEventsRepository: ProductEventsRepository,
    private readonly productsEventsPublisher: ProductsEventsPublisher,
    private readonly config: ConfigService<ServiceConfig, true>,
  ) {}

  onModuleInit(): void {
    const intervalMs = this.config.get('database.productsOutboxPollMs', {
      infer: true,
    });
    this.timer = setInterval(() => {
      void this.flushPendingOutbox();
    }, intervalMs);
    this.logger.log(
      `Outbox relay: cada ${intervalMs}ms, lote hasta ${OUTBOX_BATCH_SIZE} eventos`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async flushPendingOutbox(): Promise<void> {
    if (this.flushInProgress) {
      return;
    }
    this.flushInProgress = true;
    try {
      const pending = await this.productEventsRepository.findPendingOutbox(
        OUTBOX_BATCH_SIZE,
      );
      for (const event of pending) {
        try {
          await this.publishOutboxEvent(event);
          await this.productEventsRepository.markPublished(event.id);
        } catch (err) {
          this.logger.warn(
            `Outbox: fallo al publicar ${event.id} (${event.type}); se reintenta en el próximo ciclo.`,
            err instanceof Error ? err.message : err,
          );
          break;
        }
      }
    } finally {
      this.flushInProgress = false;
    }
  }

  private async publishOutboxEvent(event: ProductEvent): Promise<void> {
    const product = event.payload as Product;
    if (event.type === PRODUCT_CREATED_EVENT) {
      await this.productsEventsPublisher.publishProductCreated(product);
      return;
    }
    if (event.type === PRODUCT_UPDATED_EVENT) {
      await this.productsEventsPublisher.publishProductUpdated(product);
      return;
    }
    throw new Error(`tipo de evento no soportado en outbox: ${event.type}`);
  }
}
