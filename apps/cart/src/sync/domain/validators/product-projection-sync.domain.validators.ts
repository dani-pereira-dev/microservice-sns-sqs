import {
  PRODUCT_CREATED_EVENT,
  PRODUCT_UPDATED_EVENT,
} from '@shared/contracts/events';
import { Product } from '@shared/contracts/products';

export interface ProductLifecycleEventEnvelope {
  eventType: string;
  payload: unknown;
}

export const isNonNullObjectValue = (
  unknownValue: unknown,
): unknownValue is object => unknownValue != null && typeof unknownValue === 'object';

export const isProductLifecycleEventEnvelope = (
  candidateObject: object,
): candidateObject is ProductLifecycleEventEnvelope => {
  const record = candidateObject as Record<string, unknown>;

  return (
    typeof record.eventType === 'string' &&
    typeof record.payload !== 'undefined'
  );
};

export const isProductUpsertLifecycleEventType = (
  eventType: string,
): eventType is typeof PRODUCT_CREATED_EVENT | typeof PRODUCT_UPDATED_EVENT =>
  eventType === PRODUCT_CREATED_EVENT || eventType === PRODUCT_UPDATED_EVENT;

export const isProductSnapshot = (
  unknownValue: unknown,
): unknownValue is Product => {
  if (!unknownValue || typeof unknownValue !== 'object') {
    return false;
  }

  const candidateRecord = unknownValue as Record<string, unknown>;

  return (
    typeof candidateRecord.id === 'string' &&
    typeof candidateRecord.title === 'string' &&
    typeof candidateRecord.price === 'number' &&
    typeof candidateRecord.active === 'boolean' &&
    typeof candidateRecord.updatedAt === 'string'
  );
};
