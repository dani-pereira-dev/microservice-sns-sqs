import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { Repository } from "typeorm";
import { Payment } from "./payment.entity";

/**
 * Escrituras: fila `payments` con `published_at` null hasta enviar a SNS.
 */
@Injectable()
export class PaymentsCommandRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
  ) {}

  async createPayment(
    payment: PaymentConfirmation,
  ): Promise<PaymentConfirmation> {
    await this.payments.save(
      this.payments.create({
        idempotencyKey: payment.idempotencyKey,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        confirmedAt: payment.confirmedAt,
        publishedAt: null,
      }),
    );

    return payment;
  }

  async markPublished(
    paymentId: string,
    publishedAt: Date = new Date(),
  ): Promise<void> {
    await this.payments.update({ paymentId }, { publishedAt });
  }
}
