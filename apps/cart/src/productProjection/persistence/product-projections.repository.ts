import { Injectable } from '@nestjs/common';
import { CartDatabase } from '../../shared/persistence/cart-database';
import { ProductProjection } from '../domain/product-projection.model';
import { ProductProjectionRow } from './product-projection.persistence.types';

@Injectable()
export class ProductProjectionsRepository {
  constructor(private readonly cartDatabase: CartDatabase) {}

  list(): ProductProjection[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, title, price, active, updated_at
          FROM product_projections
          ORDER BY id ASC
        `,
      )
      .all() as ProductProjectionRow[];

    return rows.map((row) => this.mapRowToProductProjection(row));
  }

  findById(productId: string): ProductProjection | null {
    const row = this.database
      .prepare(
        `
          SELECT id, title, price, active, updated_at
          FROM product_projections
          WHERE id = ?
        `,
      )
      .get(productId) as ProductProjectionRow | undefined;

    return row ? this.mapRowToProductProjection(row) : null;
  }

  upsert(product: ProductProjection): ProductProjection {
    this.database
      .prepare(
        `
          INSERT INTO product_projections (id, title, price, active, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            price = excluded.price,
            active = excluded.active,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        product.id,
        product.title,
        product.price,
        product.active ? 1 : 0,
        product.updatedAt,
      );

    return product;
  }

  private get database() {
    return this.cartDatabase.connection;
  }

  private mapRowToProductProjection(
    row: ProductProjectionRow,
  ): ProductProjection {
    return {
      id: row.id,
      title: row.title,
      price: row.price,
      active: row.active === 1,
      updatedAt: row.updated_at,
    };
  }
}
