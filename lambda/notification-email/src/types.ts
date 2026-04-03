export const PAYMENT_CONFIRMED_EVENT = 'payment.confirmed';

export interface PaymentConfirmation {
  idempotencyKey: string;
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: 'confirmed';
  confirmedAt: string;
  recipientEmail?: string;
}

export interface PaymentConfirmedEvent {
  eventId: string;
  eventType: typeof PAYMENT_CONFIRMED_EVENT;
  occurredAt: string;
  source: string;
  payload: PaymentConfirmation;
}

export interface SnsEnvelope {
  Type?: string;
  Message?: string;
}
