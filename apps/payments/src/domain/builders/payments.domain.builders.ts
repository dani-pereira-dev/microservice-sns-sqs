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

export const buildPaymentConfirmedEvent = (
  payment: PaymentConfirmation,
): PaymentConfirmedEvent => ({
  eventId: crypto.randomUUID(),
  eventType: PAYMENT_CONFIRMED_EVENT,
  occurredAt: new Date().toISOString(),
  source: 'payments',
  payload: payment,
});
