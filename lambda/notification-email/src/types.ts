export const ORDER_CONFIRMED_EVENT = 'order.confirmed';
export const ORDER_CONFIRMATION_FAILED_EVENT = 'order.confirmation_failed';

export interface PaymentSnapshot {
  idempotencyKey: string;
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  confirmedAt: string;
  recipientEmail?: string;
}

export interface OrderConfirmedPayload {
  orderId: string;
  customerName: string;
  amount: number;
  confirmedAt: string;
  payment: PaymentSnapshot;
}

export interface OrderConfirmationFailedPayload {
  orderId: string;
  payment: PaymentSnapshot;
  reason: string;
  failedAt: string;
}

export interface BaseNotificationEvent<TEventType extends string, TPayload> {
  eventId: string;
  eventType: TEventType;
  occurredAt: string;
  source: string;
  payload: TPayload;
}

export type OrderConfirmedEvent = BaseNotificationEvent<
  typeof ORDER_CONFIRMED_EVENT,
  OrderConfirmedPayload
>;

export type OrderConfirmationFailedEvent = BaseNotificationEvent<
  typeof ORDER_CONFIRMATION_FAILED_EVENT,
  OrderConfirmationFailedPayload
>;

export type OrderStatusEvent = OrderConfirmedEvent | OrderConfirmationFailedEvent;

export interface SnsEnvelope {
  Type?: string;
  Message?: string;
}
