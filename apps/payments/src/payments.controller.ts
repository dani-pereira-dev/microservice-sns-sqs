import { Body, Controller, Get, Post } from "@nestjs/common";
import { ConfirmPaymentRequest } from "@shared/contracts/payments";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments() {
    return this.paymentsService.listPayments();
  }

  @Post("confirm")
  confirmPayment(@Body() body: ConfirmPaymentRequest) {
    return this.paymentsService.confirmPayment(body);
  }
}
