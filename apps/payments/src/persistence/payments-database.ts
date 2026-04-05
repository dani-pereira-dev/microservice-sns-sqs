import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentsDomainLogger } from '../domain/logging/payments-domain.logger';

@Injectable()
export class PaymentsDatabase {
  readonly connection: Database.Database;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly paymentsDomainLogger: PaymentsDomainLogger,
  ) {
    const configuredPath = this.configService.get('database.paymentsDbPath', {
      infer: true,
    });
    const databasePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);

    mkdirSync(path.dirname(databasePath), { recursive: true });

    this.connection = new Database(databasePath);
    this.connection.pragma('journal_mode = WAL');
    this.connection.pragma('synchronous = NORMAL');

    this.connection.exec(`
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

    this.connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_payments_order_id
      ON payments(order_id)
    `);

    this.connection.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key
      ON payments(idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `);

    this.connection.exec(`
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

    this.connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_payment_outbox_status_created_at
      ON payment_outbox(status, created_at)
    `);

    this.paymentsDomainLogger.log(
      `SQLite persistence enabled at ${databasePath}.`,
    );
  }

  runInTransaction<T>(callback: (database: Database.Database) => T) {
    const transaction = this.connection.transaction(() =>
      callback(this.connection),
    );

    return transaction();
  }
}
