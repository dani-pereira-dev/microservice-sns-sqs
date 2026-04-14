import { Injectable } from "@nestjs/common";
import { PaymentsQueryRepository } from "../../persistence/payments/payments-query.repository";
import { requireExistingPayment } from "../validators/payments.domain.validators";

@Injectable()
export class PaymentsQueryService {
  constructor(
    private readonly paymentsQueryRepository: PaymentsQueryRepository,
  ) {}

  listPayments() {
    return this.paymentsQueryRepository.listPayments();
  }

  async getPaymentById(paymentId: string) {
    return requireExistingPayment(
      await this.paymentsQueryRepository.findPaymentById(paymentId),
      paymentId,
    );
  }
}
