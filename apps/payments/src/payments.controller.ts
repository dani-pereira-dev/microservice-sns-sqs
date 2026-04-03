import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ConfirmPaymentRequest } from "@shared/contracts/payments";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments() {
    return this.paymentsService.listPayments();
  }

  @Get(":paymentId")
  getPaymentById(@Param("paymentId") paymentId: string) {
    return this.paymentsService.getPaymentById(paymentId);
  }

  @Post("confirm")
  confirmPayment(@Body() body: ConfirmPaymentRequest) {
    return this.paymentsService.confirmPayment(body);
  }
}
