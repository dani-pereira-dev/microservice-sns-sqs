import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutInitiatedPayload } from '@shared/contracts/events';
import { PaymentConfirmation } from "@shared/contracts/payments";
import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  Order,
  OrderItem,
} from '@shared/contracts/orders';
import { formatOrdersLog } from '@shared/messaging/messaging-log.utils';
import { OrdersRepository } from './orders.repository';

export interface ApplyPaymentConfirmationResult {
  order: Order;
  alreadyProcessed: boolean;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  listOrders() {
    return this.ordersRepository.list();
  }

  getOrderById(orderId: string) {
    const order = this.ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    return order;
  }

  createOrder(input: CreateOrderRequest) {
    this.validateCreateOrderInput(input);

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
    const order = this.ordersRepository.findById(payment.orderId);

    if (!order) {
      throw new NotFoundException(`Order ${payment.orderId} not found.`);
    }

    if (order.status === "confirmed") {
      if (order.payment?.paymentId === payment.paymentId) {
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

      throw new BadRequestException(
        `Order ${payment.orderId} is already confirmed.`,
      );
    }

    if (payment.amount !== order.amount) {
      throw new BadRequestException(
        `Payment amount must match the order amount (${order.amount}).`,
      );
    }

    const confirmedAt = new Date().toISOString();

    order.status = "confirmed";
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

  private validateCreateOrderInput(input: CreateOrderRequest) {
    if (!input.customerName?.trim()) {
      throw new BadRequestException('customerName is required.');
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('items must contain at least one item.');
    }

    for (const item of input.items) {
      this.validateCreateOrderItemInput(item);
    }
  }

  private validateCreateOrderItemInput(input: CreateOrderItemRequest) {
    if (!input.productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }

    if (!input.productTitleSnapshot?.trim()) {
      throw new BadRequestException('productTitleSnapshot is required.');
    }

    if (typeof input.unitPrice !== 'number' || input.unitPrice <= 0) {
      throw new BadRequestException(
        'unitPrice must be a number greater than 0.',
      );
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException(
        'quantity must be an integer greater than 0.',
      );
    }
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
