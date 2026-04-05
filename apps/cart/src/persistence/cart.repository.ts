import { Injectable } from '@nestjs/common';
import { Cart, CartItem } from '@shared/contracts/cart';
import { CartDatabase } from './cart-database';
import { CartItemRow, CartRow } from './cart.persistence.types';

@Injectable()
export class CartRepository {
  constructor(private readonly cartDatabase: CartDatabase) {}

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
        null,
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
        null,
        cart.id,
      );

    return cart;
  }

  private get database() {
    return this.cartDatabase.connection;
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
