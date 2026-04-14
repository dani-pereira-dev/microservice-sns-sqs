import { Injectable } from "@nestjs/common";
import { OrderCreatedEvent } from "@shared/contracts/events";
import { PaymentsCommandService } from "./payments-command.service";
import { PaymentsQueryService } from "./payments-query.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsQueryService: PaymentsQueryService,
    private readonly paymentsCommandService: PaymentsCommandService,
  ) {}

  listPayments() {
    return this.paymentsQueryService.listPayments();
  }

  getPaymentById(paymentId: string) {
    return this.paymentsQueryService.getPaymentById(paymentId);
  }

  async confirmPaymentFromOrderCreated(event: OrderCreatedEvent) {
    return this.paymentsCommandService.confirmPaymentFromOrderCreated(event);
  }
}
