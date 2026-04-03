import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';

interface PaymentRow {
  payment_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: 'confirmed';
  confirmed_at: string;
}

@Injectable()
export class PaymentsRepository {
  private readonly logger = new Logger(PaymentsRepository.name);
  private readonly database: Database.Database;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const configuredPath = this.configService.get('database.paymentsDbPath', {
      infer: true,
    });
    const databasePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);

    mkdirSync(path.dirname(databasePath), { recursive: true });

    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.database.pragma('synchronous = NORMAL');

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        confirmed_at TEXT NOT NULL
      )
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_payments_order_id
      ON payments(order_id)
    `);

    this.logger.log(`SQLite persistence enabled at ${databasePath}.`);
  }

  create(payment: PaymentConfirmation): PaymentConfirmation {
    this.database
      .prepare(
        `
          INSERT INTO payments (
            payment_id, order_id, amount, payment_method, status, confirmed_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        payment.paymentId,
        payment.orderId,
        payment.amount,
        payment.paymentMethod,
        payment.status,
        payment.confirmedAt,
      );

    return payment;
  }

  findByPaymentId(paymentId: string): PaymentConfirmation | null {
    const row = this.database
      .prepare(
        `
          SELECT payment_id, order_id, amount, payment_method, status, confirmed_at
          FROM payments
          WHERE payment_id = ?
        `,
      )
      .get(paymentId) as PaymentRow | undefined;

    return row ? this.mapRowToPayment(row) : null;
  }

  list(): PaymentConfirmation[] {
    const rows = this.database
      .prepare(
        `
          SELECT payment_id, order_id, amount, payment_method, status, confirmed_at
          FROM payments
          ORDER BY confirmed_at ASC
        `,
      )
      .all() as PaymentRow[];

    return rows.map((row) => this.mapRowToPayment(row));
  }

  private mapRowToPayment(row: PaymentRow): PaymentConfirmation {
    return {
      paymentId: row.payment_id,
      orderId: row.order_id,
      amount: row.amount,
      paymentMethod: row.payment_method,
      status: row.status,
      confirmedAt: row.confirmed_at,
    };
  }
}
