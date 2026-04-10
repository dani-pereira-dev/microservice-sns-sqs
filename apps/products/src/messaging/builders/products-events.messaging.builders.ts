import {
  DOMAIN_EVENT_SOURCE_PRODUCTS,
  PRODUCT_CREATED_EVENT,
  PRODUCT_UPDATED_EVENT,
  ProductCreatedEvent,
  ProductUpdatedEvent,
} from '@shared/contracts/events';
import { Product } from '@shared/contracts/products';

const generateDomainEventId = () => crypto.randomUUID();

const currentTimestampIso = () => new Date().toISOString();

const buildProductLifecycleEventBase = (product: Product) => ({
  eventId: generateDomainEventId(),
  occurredAt: currentTimestampIso(),
  source: DOMAIN_EVENT_SOURCE_PRODUCTS,
  payload: product,
});

export const buildProductCreatedEvent = (
  product: Product,
): ProductCreatedEvent => ({
  ...buildProductLifecycleEventBase(product),
  eventType: PRODUCT_CREATED_EVENT,
});

export const buildProductUpdatedEvent = (
  product: Product,
): ProductUpdatedEvent => ({
  ...buildProductLifecycleEventBase(product),
  eventType: PRODUCT_UPDATED_EVENT,
});
