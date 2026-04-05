import { Injectable, Logger } from "@nestjs/common";
import { CheckoutInitiatedPayload } from "@shared/contracts/events";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { CreateOrderRequest, Order } from "@shared/contracts/orders";
import { formatOrdersLog } from "@shared/messaging/messaging-log.utils";
import { OrdersRepository } from "../../persistence/orders.repository";
import {
  buildOrder,
  buildOrderWithPaymentConfirmation,
} from "../builders/orders.domain.builders";
import {
  ensureOrderCanReceivePayment,
  requireExistingOrderForPayment,
  validateCreateOrderInput,
} from "../validators/orders.domain.validators";

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
    const order: Order = buildOrder(input, now);

    return this.ordersRepository.create(order);
  }

  createOrderFromCheckout(input: CheckoutInitiatedPayload) {
    const existingOrder = this.ordersRepository.findBySourceCartId(
      input.cartId,
    );

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

    if (paymentAction === "already_processed") {
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
    const confirmedOrder = buildOrderWithPaymentConfirmation(
      order,
      payment,
      confirmedAt,
    );

    this.logger.log(
      formatOrdersLog(
        `Order ${order.id} confirmed from payment ${payment.paymentId}.`,
      ),
    );

    return {
      order: this.ordersRepository.save(confirmedOrder),
      alreadyProcessed: false,
    };
  }
}
