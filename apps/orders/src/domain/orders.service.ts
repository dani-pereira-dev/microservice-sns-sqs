import { Injectable } from '@nestjs/common';
import { CheckoutInitiatedPayload } from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { CreateOrderRequest } from '@shared/contracts/orders';
import {
  ApplyPaymentConfirmationResult,
  OrdersCommandService,
} from './orders-command.service';
import { OrdersQueryService } from './orders-query.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersQueryService: OrdersQueryService,
    private readonly ordersCommandService: OrdersCommandService,
  ) {}

  listOrders() {
    return this.ordersQueryService.listOrders();
  }

  getOrderById(orderId: string) {
    return this.ordersQueryService.getOrderById(orderId);
  }

  createOrder(input: CreateOrderRequest) {
    return this.ordersCommandService.createOrder(input);
  }

  createOrderFromCheckout(input: CheckoutInitiatedPayload) {
    return this.ordersCommandService.createOrderFromCheckout(input);
  }

  applyPaymentConfirmation(
    payment: PaymentConfirmation,
  ): ApplyPaymentConfirmationResult {
    return this.ordersCommandService.applyPaymentConfirmation(payment);
  }
}
