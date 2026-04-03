export interface ConfirmPaymentRequest {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentConfirmation {
  idempotencyKey: string;
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: 'confirmed';
  confirmedAt: string;
}
