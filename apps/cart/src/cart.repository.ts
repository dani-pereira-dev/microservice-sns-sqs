import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cart, CartItem, CartStatus } from '@shared/contracts/cart';
import { ServiceConfig } from '@shared/config/service-config.types';

interface CartRow {
  id: string;
  customer_name: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
  checked_out_order_id: string | null;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  product_title_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

@Injectable()
export class CartRepository {
  private readonly logger = new Logger(CartRepository.name);
  private readonly database: Database.Database;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const configuredPath = this.configService.get('database.cartDbPath', {
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
      CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        checked_out_order_id TEXT
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_title_snapshot TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        line_total REAL NOT NULL
      )
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id
      ON cart_items(cart_id)
    `);

    this.logger.log(`SQLite persistence enabled at ${databasePath}.`);
  }

  list(): Cart[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, customer_name, status, created_at, updated_at, checked_out_order_id
          FROM carts
          ORDER BY created_at ASC
        `,
      )
      .all() as CartRow[];

    return rows.map((row) => this.mapRowToCart(row));
  }

  findById(cartId: string): Cart | null {
    const row = this.database
      .prepare(
        `
          SELECT id, customer_name, status, created_at, updated_at, checked_out_order_id
          FROM carts
          WHERE id = ?
        `,
      )
      .get(cartId) as CartRow | undefined;

    return row ? this.mapRowToCart(row) : null;
  }

  findItemByProductId(cartId: string, productId: string): CartItem | null {
    const row = this.database
      .prepare(
        `
          SELECT id, cart_id, product_id, product_title_snapshot, unit_price, quantity, line_total
          FROM cart_items
          WHERE cart_id = ? AND product_id = ?
        `,
      )
      .get(cartId, productId) as CartItemRow | undefined;

    return row ? this.mapRowToCartItem(row) : null;
  }

  findItemById(cartId: string, itemId: string): CartItem | null {
    const row = this.database
      .prepare(
        `
          SELECT id, cart_id, product_id, product_title_snapshot, unit_price, quantity, line_total
          FROM cart_items
          WHERE cart_id = ? AND id = ?
        `,
      )
      .get(cartId, itemId) as CartItemRow | undefined;

    return row ? this.mapRowToCartItem(row) : null;
  }

  createCart(cart: Cart): Cart {
    this.database
      .prepare(
        `
          INSERT INTO carts (
            id, customer_name, status, created_at, updated_at, checked_out_order_id
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        cart.id,
        cart.customerName,
        cart.status,
        cart.createdAt,
        cart.updatedAt,
        cart.checkedOutOrderId ?? null,
      );

    return cart;
  }

  upsertCartItem(cartId: string, item: CartItem) {
    const existingItem = this.findItemById(cartId, item.id);

    if (existingItem) {
      this.database
        .prepare(
          `
            UPDATE cart_items
            SET product_id = ?,
                product_title_snapshot = ?,
                unit_price = ?,
                quantity = ?,
                line_total = ?
            WHERE id = ? AND cart_id = ?
          `,
        )
        .run(
          item.productId,
          item.productTitleSnapshot,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
          item.id,
          cartId,
        );

      return item;
    }

    this.database
      .prepare(
        `
          INSERT INTO cart_items (
            id, cart_id, product_id, product_title_snapshot, unit_price, quantity, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        item.id,
        cartId,
        item.productId,
        item.productTitleSnapshot,
        item.unitPrice,
        item.quantity,
        item.lineTotal,
      );

    return item;
  }

  deleteCartItem(cartId: string, itemId: string) {
    this.database
      .prepare(
        `
          DELETE FROM cart_items
          WHERE cart_id = ? AND id = ?
        `,
      )
      .run(cartId, itemId);
  }

  saveCart(cart: Cart): Cart {
    this.database
      .prepare(
        `
          UPDATE carts
          SET customer_name = ?,
              status = ?,
              created_at = ?,
              updated_at = ?,
              checked_out_order_id = ?
          WHERE id = ?
        `,
      )
      .run(
        cart.customerName,
        cart.status,
        cart.createdAt,
        cart.updatedAt,
        cart.checkedOutOrderId ?? null,
        cart.id,
      );

    return cart;
  }

  private mapRowToCart(row: CartRow): Cart {
    const items = this.listItems(row.id);

    return {
      id: row.id,
      customerName: row.customer_name,
      status: row.status,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      checkedOutOrderId: row.checked_out_order_id ?? undefined,
    };
  }

  private listItems(cartId: string): CartItem[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, cart_id, product_id, product_title_snapshot, unit_price, quantity, line_total
          FROM cart_items
          WHERE cart_id = ?
          ORDER BY id ASC
        `,
      )
      .all(cartId) as CartItemRow[];

    return rows.map((row) => this.mapRowToCartItem(row));
  }

  private mapRowToCartItem(row: CartItemRow): CartItem {
    return {
      id: row.id,
      productId: row.product_id,
      productTitleSnapshot: row.product_title_snapshot,
      unitPrice: row.unit_price,
      quantity: row.quantity,
      lineTotal: row.line_total,
    };
  }
}
