import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { IsNull, Repository } from "typeorm";
import { Payment } from "./payment.entity";
import { paymentRowToConfirmation } from "./payment-confirmed-event.builders";

/**
 * Lecturas de pagos; pendientes de SNS vía `findPendingOutbox` (como `ProductEventsRepository`).
 */
@Injectable()
export class PaymentsQueryRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
  ) {}

  async findPaymentById(
    paymentId: string,
  ): Promise<PaymentConfirmation | null> {
    const row = await this.payments.findOne({ where: { paymentId } });
    return row ? paymentRowToConfirmation(row) : null;
  }

  async findPaymentByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentConfirmation | null> {
    const row = await this.payments.findOne({ where: { idempotencyKey } });
    return row ? paymentRowToConfirmation(row) : null;
  }

  async listPayments(): Promise<PaymentConfirmation[]> {
    const rows = await this.payments.find({
      order: { confirmedAt: "ASC" },
    });
    return rows.map((row) => paymentRowToConfirmation(row));
  }

  /** Eventos pendientes de publicar (outbox), más antiguos primero. */
  async findPendingOutbox(limit: number): Promise<Payment[]> {
    return this.payments.find({
      where: { publishedAt: IsNull() },
      order: { confirmedAt: "ASC" },
      take: limit,
    });
  }
}
