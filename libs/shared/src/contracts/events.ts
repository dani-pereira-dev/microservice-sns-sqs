import { PaymentConfirmation } from './payments';
import { CreateOrderItemRequest, Order } from './orders';
import { Product } from './products';

export const CHECKOUT_INITIATED_EVENT = 'checkout.initiated';
export const ORDER_CREATED_EVENT = 'order.created';
export const PAYMENT_CONFIRMED_EVENT = 'payment.confirmed';
export const ORDER_CONFIRMED_EVENT = 'order.confirmed';
export const ORDER_CONFIRMATION_FAILED_EVENT = 'order.confirmation_failed';

export const PRODUCT_CREATED_EVENT = 'product.created';
export const PRODUCT_UPDATED_EVENT = 'product.updated';

export const DOMAIN_EVENT_SOURCE_PRODUCTS = 'products';

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

export type ProductSnapshotPayload = Product;

export type ProductCreatedEvent = DomainEvent<
  typeof PRODUCT_CREATED_EVENT,
  ProductSnapshotPayload
>;

export type ProductUpdatedEvent = DomainEvent<
  typeof PRODUCT_UPDATED_EVENT,
  ProductSnapshotPayload
>;

export type ProductLifecycleEvent = ProductCreatedEvent | ProductUpdatedEvent;
