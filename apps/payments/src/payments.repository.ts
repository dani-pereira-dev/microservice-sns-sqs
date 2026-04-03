import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentConfirmedEvent } from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { ServiceConfig } from '@shared/config/service-config.types';

interface PaymentRow {
  idempotency_key: string;
  payment_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: 'confirmed';
  confirmed_at: string;
}

interface OutboxEventRow {
  event_id: string;
  topic_arn: string;
  message_json: string;
  attributes_json: string | null;
  status: 'pending' | 'published';
  attempts: number;
  last_error: string | null;
  created_at: string;
  published_at: string | null;
}

export interface PendingOutboxEvent {
  eventId: string;
  topicArn: string;
  message: PaymentConfirmedEvent;
  attributes: Record<string, string>;
  attempts: number;
}

export interface OutboxEventRecord {
  eventId: string;
  topicArn: string;
  message: PaymentConfirmedEvent;
  attributes: Record<string, string>;
  status: 'pending' | 'published';
  attempts: number;
  lastError: string | null;
  createdAt: string;
  publishedAt: string | null;
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
        idempotency_key TEXT,
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

    this.ensureIdempotencyKeyColumn();
    this.database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key
      ON payments(idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS payment_outbox (
        event_id TEXT PRIMARY KEY,
        topic_arn TEXT NOT NULL,
        message_json TEXT NOT NULL,
        attributes_json TEXT,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        published_at TEXT
      )
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_payment_outbox_status_created_at
      ON payment_outbox(status, created_at)
    `);

    this.logger.log(`SQLite persistence enabled at ${databasePath}.`);
  }

  createWithOutbox(
    payment: PaymentConfirmation,
    event: PaymentConfirmedEvent,
    topicArn: string,
  ): PaymentConfirmation {
    const insertPayment = this.database.prepare(`
      INSERT INTO payments (
        idempotency_key, payment_id, order_id, amount, payment_method, status, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOutboxEvent = this.database.prepare(`
      INSERT INTO payment_outbox (
        event_id, topic_arn, message_json, attributes_json, status, attempts, last_error, created_at, published_at
      ) VALUES (?, ?, ?, ?, 'pending', 0, NULL, ?, NULL)
    `);

    const transaction = this.database.transaction(() => {
      insertPayment.run(
        payment.idempotencyKey,
        payment.paymentId,
        payment.orderId,
        payment.amount,
        payment.paymentMethod,
        payment.status,
        payment.confirmedAt,
      );

      insertOutboxEvent.run(
        event.eventId,
        topicArn,
        JSON.stringify(event),
        JSON.stringify({
          eventType: event.eventType,
          source: event.source,
        }),
        event.occurredAt,
      );
    });

    transaction();

    return payment;
  }

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

  listOutboxEvents(): OutboxEventRecord[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            event_id,
            topic_arn,
            message_json,
            attributes_json,
            status,
            attempts,
            last_error,
            created_at,
            published_at
          FROM payment_outbox
          ORDER BY created_at ASC
        `,
      )
      .all() as OutboxEventRow[];

    return rows.map((row) => this.mapRowToOutboxEvent(row));
  }

  listPendingOutboxEvents(limit = 10): PendingOutboxEvent[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            event_id,
            topic_arn,
            message_json,
            attributes_json,
            status,
            attempts,
            last_error,
            created_at,
            published_at
          FROM payment_outbox
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT ?
        `,
      )
      .all(limit) as OutboxEventRow[];

    return rows.map((row) => {
      const event = this.mapRowToOutboxEvent(row);

      return {
        eventId: event.eventId,
        topicArn: event.topicArn,
        message: event.message,
        attributes: event.attributes,
        attempts: event.attempts,
      };
    });
  }

  markOutboxEventPublished(eventId: string) {
    this.database
      .prepare(
        `
          UPDATE payment_outbox
          SET status = 'published',
              published_at = ?,
              last_error = NULL
          WHERE event_id = ?
        `,
      )
      .run(new Date().toISOString(), eventId);
  }

  markOutboxEventFailed(eventId: string, errorMessage: string) {
    this.database
      .prepare(
        `
          UPDATE payment_outbox
          SET attempts = attempts + 1,
              last_error = ?
          WHERE event_id = ?
        `,
      )
      .run(errorMessage, eventId);
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

  private mapRowToOutboxEvent(row: OutboxEventRow): OutboxEventRecord {
    return {
      eventId: row.event_id,
      topicArn: row.topic_arn,
      message: JSON.parse(row.message_json) as PaymentConfirmedEvent,
      attributes: row.attributes_json
        ? (JSON.parse(row.attributes_json) as Record<string, string>)
        : {},
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    };
  }

  private ensureIdempotencyKeyColumn() {
    const columns = this.database
      .prepare('PRAGMA table_info(payments)')
      .all() as Array<{ name: string }>;

    const hasIdempotencyKeyColumn = columns.some(
      (column) => column.name === 'idempotency_key',
    );

    if (!hasIdempotencyKeyColumn) {
      this.database.exec(`
        ALTER TABLE payments
        ADD COLUMN idempotency_key TEXT
      `);
    }
  }
}
