export interface ConfirmPaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentConfirmation {
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: 'confirmed';
  confirmedAt: string;
}
