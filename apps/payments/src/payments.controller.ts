import { Body, Controller, Post } from "@nestjs/common";
import { ConfirmPaymentRequest } from "@shared/contracts/payments";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("confirm")
  confirmPayment(@Body() body: ConfirmPaymentRequest) {
    return this.paymentsService.confirmPayment(body);
  }
}
