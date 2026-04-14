import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
} from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { CreatePaymentAttemptInput } from '../validators/payments.domain.validators';

export const buildPaymentConfirmation = (
  input: CreatePaymentAttemptInput,
): PaymentConfirmation => ({
  idempotencyKey: input.idempotencyKey,
  paymentId: crypto.randomUUID(),
  orderId: input.orderId,
  amount: input.amount,
  paymentMethod: input.paymentMethod,
  status: 'confirmed',
  confirmedAt: new Date().toISOString(),
});

/**
 * Envelope estable para SNS y outbox: `eventId` === `paymentId`, `occurredAt` === `confirmedAt`.
 */
export const buildPaymentConfirmedEvent = (
  payment: PaymentConfirmation,
): PaymentConfirmedEvent => ({
  eventId: payment.paymentId,
  eventType: PAYMENT_CONFIRMED_EVENT,
  occurredAt: payment.confirmedAt,
  source: 'payments',
  payload: payment,
});
