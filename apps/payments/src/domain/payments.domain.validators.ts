import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentConfirmation } from '@shared/contracts/payments';

export interface CreatePaymentAttemptInput {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export const validateCreatePaymentAttemptInput = (
  input: CreatePaymentAttemptInput,
) => {
  if (!input.idempotencyKey?.trim()) {
    throw new BadRequestException('idempotencyKey is required.');
  }

  if (!input.orderId?.trim()) {
    throw new BadRequestException('orderId is required.');
  }

  if (typeof input.amount !== 'number' || input.amount <= 0) {
    throw new BadRequestException('amount must be a number greater than 0.');
  }

  if (!input.paymentMethod?.trim()) {
    throw new BadRequestException('paymentMethod is required.');
  }
};

export const ensureIdempotentRequestMatches = (
  existingPayment: PaymentConfirmation,
  input: CreatePaymentAttemptInput,
) => {
  if (existingPayment.orderId !== input.orderId) {
    throw new ConflictException(
      'idempotencyKey already used with a different orderId.',
    );
  }

  if (existingPayment.paymentMethod !== input.paymentMethod) {
    throw new ConflictException(
      'idempotencyKey already used with a different paymentMethod.',
    );
  }

  if (existingPayment.amount !== input.amount) {
    throw new ConflictException(
      'idempotencyKey already used with a different amount.',
    );
  }
};

export const requirePaymentConfirmedTopicArn = (topicArn?: string) => {
  if (!topicArn) {
    throw new BadRequestException(
      'AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN is not configured.',
    );
  }

  return topicArn;
};

export const requireExistingPayment = (
  payment: PaymentConfirmation | null,
  paymentId: string,
) => {
  if (!payment) {
    throw new NotFoundException(`Payment ${paymentId} not found.`);
  }

  return payment;
};
