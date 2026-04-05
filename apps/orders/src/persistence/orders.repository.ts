import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, OrderItem, OrderPaymentInfo } from '@shared/contracts/orders';
import { ServiceConfig } from '@shared/config/service-config.types';
import { formatOrdersLog } from '@shared/messaging/messaging-log.utils';
import { OrderItemRow, OrderRow } from './orders.persistence.types';

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
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        source_cart_id TEXT,
        payment_json TEXT
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_title_snapshot TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        line_total REAL NOT NULL
      )
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id
      ON order_items(order_id)
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_orders_source_cart_id
      ON orders(source_cart_id)
    `);

    this.logger.log(
      formatOrdersLog(`SQLite persistence enabled at ${databasePath}.`),
    );
  }

  list(): Order[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, customer_name, amount, status, created_at, updated_at, source_cart_id, payment_json
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
          SELECT id, customer_name, amount, status, created_at, updated_at, source_cart_id, payment_json
          FROM orders
          WHERE id = ?
        `,
      )
      .get(orderId) as OrderRow | undefined;

    return row ? this.mapRowToOrder(row) : null;
  }

  findBySourceCartId(sourceCartId: string): Order | null {
    const row = this.database
      .prepare(
        `
          SELECT id, customer_name, amount, status, created_at, updated_at, source_cart_id, payment_json
          FROM orders
          WHERE source_cart_id = ?
          ORDER BY created_at ASC
          LIMIT 1
        `,
      )
      .get(sourceCartId) as OrderRow | undefined;

    return row ? this.mapRowToOrder(row) : null;
  }

  create(order: Order): Order {
    const insertOrder = this.database.prepare(`
      INSERT INTO orders (
        id, customer_name, amount, status, created_at, updated_at, source_cart_id, payment_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = this.database.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_title_snapshot, unit_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.database.transaction(() => {
      insertOrder.run(...this.mapOrderToParams(order));

      for (const item of order.items) {
        insertItem.run(
          item.id,
          order.id,
          item.productId,
          item.productTitleSnapshot,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        );
      }
    });

    transaction();

    return order;
  }

  save(order: Order): Order {
    this.database
      .prepare(
        `
          UPDATE orders
          SET customer_name = ?,
              amount = ?,
              status = ?,
              created_at = ?,
              updated_at = ?,
              source_cart_id = ?,
              payment_json = ?
          WHERE id = ?
        `,
      )
      .run(
        order.customerName,
        order.amount,
        order.status,
        order.createdAt,
        order.updatedAt,
        order.sourceCartId ?? null,
        this.serializePayment(order.payment),
        order.id,
      );

    return order;
  }

  private mapRowToOrder(row: OrderRow): Order {
    return {
      id: row.id,
      customerName: row.customer_name,
      items: this.listItemsByOrderId(row.id),
      amount: row.amount,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sourceCartId: row.source_cart_id ?? undefined,
      payment: row.payment_json
        ? (JSON.parse(row.payment_json) as OrderPaymentInfo)
        : undefined,
    };
  }

  private mapOrderToParams(order: Order) {
    return [
      order.id,
      order.customerName,
      order.amount,
      order.status,
      order.createdAt,
      order.updatedAt,
      order.sourceCartId ?? null,
      this.serializePayment(order.payment),
    ] as const;
  }

  private listItemsByOrderId(orderId: string): OrderItem[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, order_id, product_id, product_title_snapshot, unit_price, quantity, line_total
          FROM order_items
          WHERE order_id = ?
          ORDER BY id ASC
        `,
      )
      .all(orderId) as OrderItemRow[];

    return rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productTitleSnapshot: row.product_title_snapshot,
      unitPrice: row.unit_price,
      quantity: row.quantity,
      lineTotal: row.line_total,
    }));
  }

  private serializePayment(payment?: OrderPaymentInfo) {
    return payment ? JSON.stringify(payment) : null;
  }
}
