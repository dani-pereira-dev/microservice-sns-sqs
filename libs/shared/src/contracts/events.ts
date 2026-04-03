import { PaymentConfirmation } from './payments';

export const PAYMENT_CONFIRMED_EVENT = 'payment.confirmed';

export interface DomainEvent<TEventType extends string, TPayload> {
  eventId: string;
  eventType: TEventType;
  occurredAt: string;
  source: string;
  payload: TPayload;
}

export type PaymentConfirmedEvent = DomainEvent<
  typeof PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmation
>;
