import { PaymentConfirmation } from './payments';
import { CreateOrderItemRequest, Order } from './orders';

export const CHECKOUT_INITIATED_EVENT = 'checkout.initiated';
export const ORDER_CREATED_EVENT = 'order.created';
export const PAYMENT_CONFIRMED_EVENT = 'payment.confirmed';
export const ORDER_CONFIRMED_EVENT = 'order.confirmed';
export const ORDER_CONFIRMATION_FAILED_EVENT = 'order.confirmation_failed';

export interface DomainEvent<TEventType extends string, TPayload> {
  eventId: string;
  eventType: TEventType;
  occurredAt: string;
  source: string;
  payload: TPayload;
}

export interface CheckoutInitiatedPayload {
  checkoutId: string;
  cartId: string;
  customerName: string;
  items: CreateOrderItemRequest[];
  requestedAt: string;
}

export type CheckoutInitiatedEvent = DomainEvent<
  typeof CHECKOUT_INITIATED_EVENT,
  CheckoutInitiatedPayload
>;

export interface OrderCreatedPayload {
  checkoutId?: string;
  orderId: string;
  customerName: string;
  items: Order['items'];
  amount: number;
  sourceCartId?: string;
  createdAt: string;
}

export type OrderCreatedEvent = DomainEvent<
  typeof ORDER_CREATED_EVENT,
  OrderCreatedPayload
>;

export type PaymentConfirmedEvent = DomainEvent<
  typeof PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmation
>;

export interface OrderConfirmedPayload {
  orderId: string;
  customerName: string;
  amount: number;
  confirmedAt: string;
  payment: PaymentConfirmation;
}

export interface OrderConfirmationFailedPayload {
  orderId: string;
  payment: PaymentConfirmation;
  reason: string;
  failedAt: string;
}

export type OrderConfirmedEvent = DomainEvent<
  typeof ORDER_CONFIRMED_EVENT,
  OrderConfirmedPayload
>;

export type OrderConfirmationFailedEvent = DomainEvent<
  typeof ORDER_CONFIRMATION_FAILED_EVENT,
  OrderConfirmationFailedPayload
>;

export type OrderStatusEvent =
  | OrderConfirmedEvent
  | OrderConfirmationFailedEvent;
