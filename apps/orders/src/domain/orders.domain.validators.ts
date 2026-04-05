import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { CreateOrderItemRequest, CreateOrderRequest, Order } from '@shared/contracts/orders';

export const validateCreateOrderInput = (input: CreateOrderRequest) => {
  if (!input.customerName?.trim()) {
    throw new BadRequestException('customerName is required.');
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new BadRequestException('items must contain at least one item.');
  }

  for (const item of input.items) {
    validateCreateOrderItemInput(item);
  }
};

export const validateCreateOrderItemInput = (input: CreateOrderItemRequest) => {
  if (!input.productId?.trim()) {
    throw new BadRequestException('productId is required.');
  }

  if (!input.productTitleSnapshot?.trim()) {
    throw new BadRequestException('productTitleSnapshot is required.');
  }

  if (typeof input.unitPrice !== 'number' || input.unitPrice <= 0) {
    throw new BadRequestException('unitPrice must be a number greater than 0.');
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new BadRequestException(
      'quantity must be an integer greater than 0.',
    );
  }
};

export const requireExistingOrderForPayment = (
  order: Order | null,
  payment: PaymentConfirmation,
) => {
  if (!order) {
    throw new NotFoundException(`Order ${payment.orderId} not found.`);
  }

  return order;
};

export const requireExistingOrder = (order: Order | null, orderId: string) => {
  if (!order) {
    throw new NotFoundException(`Order ${orderId} not found.`);
  }

  return order;
};

export const ensureOrderCanReceivePayment = (
  order: Order,
  payment: PaymentConfirmation,
) => {
  if (order.status === 'confirmed') {
    if (order.payment?.paymentId === payment.paymentId) {
      return 'already_processed' as const;
    }

    throw new BadRequestException(`Order ${payment.orderId} is already confirmed.`);
  }

  if (payment.amount !== order.amount) {
    throw new BadRequestException(
      `Payment amount must match the order amount (${order.amount}).`,
    );
  }

  return 'process' as const;
};
