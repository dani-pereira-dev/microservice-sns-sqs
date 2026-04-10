import { Injectable } from '@nestjs/common';
import { Product } from '@shared/contracts/products';
import { ProductProjection } from '../../../productProjection/domain/product-projection.model';
import { ProductProjectionsRepository } from '../../../productProjection/persistence/product-projections.repository';
import { CartDomainLogger } from '../../../shared/logging/cart-domain.logger';
import {
  isNonNullObjectValue,
  isProductLifecycleEventEnvelope,
  isProductSnapshot,
  isProductUpsertLifecycleEventType,
} from '../validators/product-projection-sync.domain.validators';

@Injectable()
export class ProductProjectionSyncService {
  constructor(
    private readonly productProjectionsRepository: ProductProjectionsRepository,
    private readonly cartDomainLogger: CartDomainLogger,
  ) {}

  applyLifecycleEvent(untypedMessageBody: unknown): void {
    if (!isNonNullObjectValue(untypedMessageBody)) {
      this.cartDomainLogger.warn(
        'Ignoring product lifecycle message with non-object body.',
      );
      return;
    }

    if (!isProductLifecycleEventEnvelope(untypedMessageBody)) {
      this.cartDomainLogger.warn(
        'Ignoring product lifecycle message missing eventType or payload.',
      );
      return;
    }

    const { eventType, payload } = untypedMessageBody;

    if (!isProductUpsertLifecycleEventType(eventType)) {
      return;
    }

    if (!isProductSnapshot(payload)) {
      this.cartDomainLogger.warn(
        `Ignoring ${eventType} with invalid product snapshot.`,
      );
      return;
    }

    this.upsertProjectionFromProduct(payload);
  }

  private upsertProjectionFromProduct(product: Product): void {
    const projection: ProductProjection = {
      id: product.id,
      title: product.title,
      price: product.price,
      active: product.active,
      updatedAt: product.updatedAt,
    };

    this.productProjectionsRepository.upsert(projection);
  }
}
