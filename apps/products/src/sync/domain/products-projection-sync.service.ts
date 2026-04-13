import { Injectable, Logger } from '@nestjs/common';
import { Product } from '@shared/contracts/products';
import {
  isNonNullObjectValue,
  isProductLifecycleEventEnvelope,
  isProductSnapshot,
  isProductUpsertLifecycleEventType,
} from '@shared/product-events-sync/product-lifecycle-message.validators';
import { ProductProjectionRepository } from '../../persistence/product-projection/product-projection.repository';

@Injectable()
export class ProductsProjectionSyncService {
  private readonly logger = new Logger(ProductsProjectionSyncService.name);

  constructor(
    private readonly productProjectionRepository: ProductProjectionRepository,
  ) {}

  async applyLifecycleEvent(untypedMessageBody: unknown): Promise<void> {
    if (!isNonNullObjectValue(untypedMessageBody)) {
      this.logger.warn(
        'Ignorando mensaje de ciclo de producto: cuerpo no es un objeto.',
      );
      return;
    }

    if (!isProductLifecycleEventEnvelope(untypedMessageBody)) {
      this.logger.warn(
        'Ignorando mensaje de ciclo de producto: falta eventType o payload.',
      );
      return;
    }

    const { eventType, payload } = untypedMessageBody;

    if (!isProductUpsertLifecycleEventType(eventType)) {
      return;
    }

    if (!isProductSnapshot(payload)) {
      this.logger.warn(
        `Ignorando ${eventType}: snapshot de producto inválido o incompleto.`,
      );
      return;
    }

    await this.productProjectionRepository.upsertProduct(payload);
  }
}
