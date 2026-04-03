import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { CreateOrderRequest, Order } from "@shared/contracts/orders";
import { formatOrdersLog } from "@shared/messaging/messaging-log.utils";
import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  listOrders() {
    return this.ordersRepository.list();
  }

  createOrder(input: CreateOrderRequest) {
    this.validateCreateOrderInput(input);

    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      product: input.product.trim(),
      amount: input.amount,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    return this.ordersRepository.create(order);
  }

  applyPaymentConfirmation(payment: PaymentConfirmation) {
    const order = this.ordersRepository.findById(payment.orderId);

    if (!order) {
      throw new NotFoundException(`Order ${payment.orderId} not found.`);
    }

    if (order.status === "confirmed") {
      if (order.payment?.paymentId === payment.paymentId) {
        return order;
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

    return this.ordersRepository.save(order);
  }

  private validateCreateOrderInput(input: CreateOrderRequest) {
    if (!input.customerName?.trim()) {
      throw new BadRequestException("customerName is required.");
    }

    if (!input.product?.trim()) {
      throw new BadRequestException("product is required.");
    }

    if (typeof input.amount !== "number" || input.amount <= 0) {
      throw new BadRequestException("amount must be a number greater than 0.");
    }
  }
}
