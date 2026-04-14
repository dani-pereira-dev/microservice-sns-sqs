import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
} from "@shared/contracts/events";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { Payment } from "./payment.entity";

export const paymentRowToConfirmation = (
  row: Payment,
): PaymentConfirmation => ({
  idempotencyKey: row.idempotencyKey ?? "",
  paymentId: row.paymentId,
  orderId: row.orderId,
  amount: row.amount,
  paymentMethod: row.paymentMethod,
  status: row.status as PaymentConfirmation["status"],
  confirmedAt: row.confirmedAt,
});

/** Mismo envelope que el dominio: `eventId` === `paymentId`, `occurredAt` === `confirmedAt`. */
export const confirmationToPaymentConfirmedEvent = (
  payment: PaymentConfirmation,
): PaymentConfirmedEvent => ({
  eventId: payment.paymentId,
  eventType: PAYMENT_CONFIRMED_EVENT,
  occurredAt: payment.confirmedAt,
  source: "payments",
  payload: payment,
});

export const snsAttributesFromPaymentConfirmedEvent = (
  event: PaymentConfirmedEvent,
): Record<string, string> => ({
  eventType: event.eventType,
  source: event.source,
});
