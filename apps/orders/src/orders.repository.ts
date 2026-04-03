import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, OrderPaymentInfo } from '@shared/contracts/orders';
import { ServiceConfig } from '@shared/config/service-config.types';
import { formatOrdersLog } from '@shared/messaging/messaging-log.utils';

interface OrderRow {
  id: string;
  customer_name: string;
  product: string;
  amount: number;
  status: 'pending' | 'confirmed';
  created_at: string;
  updated_at: string;
  payment_json: string | null;
}

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);
  private readonly database: Database.Database;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const configuredPath = this.configService.get('database.ordersDbPath', {
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
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        product TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payment_json TEXT
      )
    `);

    this.logger.log(
      formatOrdersLog(`SQLite persistence enabled at ${databasePath}.`),
    );
  }

  list(): Order[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, customer_name, product, amount, status, created_at, updated_at, payment_json
          FROM orders
          ORDER BY created_at ASC
        `,
      )
      .all() as OrderRow[];

    return rows.map((row) => this.mapRowToOrder(row));
  }

  findById(orderId: string): Order | null {
    const row = this.database
      .prepare(
        `
          SELECT id, customer_name, product, amount, status, created_at, updated_at, payment_json
          FROM orders
          WHERE id = ?
        `,
      )
      .get(orderId) as OrderRow | undefined;

    return row ? this.mapRowToOrder(row) : null;
  }

  create(order: Order): Order {
    this.database
      .prepare(
        `
          INSERT INTO orders (
            id, customer_name, product, amount, status, created_at, updated_at, payment_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(...this.mapOrderToParams(order));

    return order;
  }

  save(order: Order): Order {
    this.database
      .prepare(
        `
          UPDATE orders
          SET customer_name = ?,
              product = ?,
              amount = ?,
              status = ?,
              created_at = ?,
              updated_at = ?,
              payment_json = ?
          WHERE id = ?
        `,
      )
      .run(
        order.customerName,
        order.product,
        order.amount,
        order.status,
        order.createdAt,
        order.updatedAt,
        this.serializePayment(order.payment),
        order.id,
      );

    return order;
  }

  private mapRowToOrder(row: OrderRow): Order {
    return {
      id: row.id,
      customerName: row.customer_name,
      product: row.product,
      amount: row.amount,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      payment: row.payment_json
        ? (JSON.parse(row.payment_json) as OrderPaymentInfo)
        : undefined,
    };
  }

  private mapOrderToParams(order: Order) {
    return [
      order.id,
      order.customerName,
      order.product,
      order.amount,
      order.status,
      order.createdAt,
      order.updatedAt,
      this.serializePayment(order.payment),
    ] as const;
  }

  private serializePayment(payment?: OrderPaymentInfo) {
    return payment ? JSON.stringify(payment) : null;
  }
}
