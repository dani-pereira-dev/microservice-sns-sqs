import { Injectable } from '@nestjs/common';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { PaymentsDatabase } from './payments-database';
import { PaymentRow } from './payments.persistence.types';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly paymentsDatabase: PaymentsDatabase) {}

  findByPaymentId(paymentId: string): PaymentConfirmation | null {
    const row = this.database
      .prepare(
        `
          SELECT idempotency_key, payment_id, order_id, amount, payment_method, status, confirmed_at
          FROM payments
          WHERE payment_id = ?
        `,
      )
      .get(paymentId) as PaymentRow | undefined;

    return row ? this.mapRowToPayment(row) : null;
  }

  findByIdempotencyKey(idempotencyKey: string): PaymentConfirmation | null {
    const row = this.database
      .prepare(
        `
          SELECT idempotency_key, payment_id, order_id, amount, payment_method, status, confirmed_at
          FROM payments
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey) as PaymentRow | undefined;

    return row ? this.mapRowToPayment(row) : null;
  }

  list(): PaymentConfirmation[] {
    const rows = this.database
      .prepare(
        `
          SELECT idempotency_key, payment_id, order_id, amount, payment_method, status, confirmed_at
          FROM payments
          ORDER BY confirmed_at ASC
        `,
      )
      .all() as PaymentRow[];

    return rows.map((row) => this.mapRowToPayment(row));
  }

  private get database() {
    return this.paymentsDatabase.connection;
  }

  private mapRowToPayment(row: PaymentRow): PaymentConfirmation {
    return {
      idempotencyKey: row.idempotency_key,
      paymentId: row.payment_id,
      orderId: row.order_id,
      amount: row.amount,
      paymentMethod: row.payment_method,
      status: row.status,
      confirmedAt: row.confirmed_at,
    };
  }
}
