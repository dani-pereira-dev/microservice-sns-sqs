import { Injectable, Logger } from '@nestjs/common';
import { CheckoutInitiatedPayload } from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  Order,
  OrderItem,
} from '@shared/contracts/orders';
import { formatOrdersLog } from '@shared/messaging/messaging-log.utils';
import { OrdersRepository } from '../persistence/orders.repository';
import {
  ensureOrderCanReceivePayment,
  requireExistingOrderForPayment,
  validateCreateOrderInput,
} from './orders.domain.validators';

export interface ApplyPaymentConfirmationResult {
  order: Order;
  alreadyProcessed: boolean;
}

@Injectable()
export class OrdersCommandService {
  private readonly logger = new Logger(OrdersCommandService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  createOrder(input: CreateOrderRequest) {
    validateCreateOrderInput(input);

    const now = new Date().toISOString();
    const items = input.items.map((item) => this.mapInputToOrderItem(item));
    const order: Order = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      items,
      amount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      sourceCartId: input.sourceCartId?.trim() || undefined,
    };

    return this.ordersRepository.create(order);
  }

  createOrderFromCheckout(input: CheckoutInitiatedPayload) {
    const existingOrder = this.ordersRepository.findBySourceCartId(input.cartId);

    if (existingOrder) {
      this.logger.log(
        formatOrdersLog(
          `Checkout ${input.checkoutId} already created order ${existingOrder.id} for cart ${input.cartId}.`,
        ),
      );

      return existingOrder;
    }

    return this.createOrder({
      customerName: input.customerName,
      items: input.items,
      sourceCartId: input.cartId,
    });
  }

  applyPaymentConfirmation(
    payment: PaymentConfirmation,
  ): ApplyPaymentConfirmationResult {
    const order = requireExistingOrderForPayment(
      this.ordersRepository.findById(payment.orderId),
      payment,
    );
    const paymentAction = ensureOrderCanReceivePayment(order, payment);

    if (paymentAction === 'already_processed') {
      this.logger.log(
        formatOrdersLog(
          `Order ${order.id} already confirmed by payment ${payment.paymentId}. Skipping duplicate processing.`,
        ),
      );

      return {
        order,
        alreadyProcessed: true,
      };
    }

    const confirmedAt = new Date().toISOString();

    order.status = 'confirmed';
    order.updatedAt = confirmedAt;
    order.payment = {
      paymentId: payment.paymentId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod.trim(),
      confirmedAt,
    };

    this.logger.log(
      formatOrdersLog(
        `Order ${order.id} confirmed from payment ${payment.paymentId}.`,
      ),
    );

    return {
      order: this.ordersRepository.save(order),
      alreadyProcessed: false,
    };
  }

  private mapInputToOrderItem(input: CreateOrderItemRequest): OrderItem {
    return {
      id: crypto.randomUUID(),
      productId: input.productId.trim(),
      productTitleSnapshot: input.productTitleSnapshot.trim(),
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      lineTotal: input.unitPrice * input.quantity,
    };
  }
}
