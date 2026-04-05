import { Controller, Get, Param } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments() {
    return this.paymentsService.listPayments();
  }

  @Get("outbox")
  listOutboxEvents() {
    return this.paymentsService.listOutboxEvents();
  }

  @Get(":paymentId")
  getPaymentById(@Param("paymentId") paymentId: string) {
    return this.paymentsService.getPaymentById(paymentId);
  }
}
