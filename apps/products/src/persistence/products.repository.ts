import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { Product } from '@shared/contracts/products';
import { ProductRow } from './products.persistence.types';

@Injectable()
export class ProductsRepository {
  private readonly logger = new Logger(ProductsRepository.name);
  private readonly database: Database.Database;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const configuredPath = this.configService.get('database.productsDbPath', {
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
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        active INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    this.logger.log(`SQLite persistence enabled at ${databasePath}.`);
  }

  list(): Product[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, title, price, active, created_at, updated_at
          FROM products
          ORDER BY created_at ASC
        `,
      )
      .all() as ProductRow[];

    return rows.map((row) => this.mapRowToProduct(row));
  }

  findById(productId: string): Product | null {
    const row = this.database
      .prepare(
        `
          SELECT id, title, price, active, created_at, updated_at
          FROM products
          WHERE id = ?
        `,
      )
      .get(productId) as ProductRow | undefined;

    return row ? this.mapRowToProduct(row) : null;
  }

  create(product: Product): Product {
    this.database
      .prepare(
        `
          INSERT INTO products (id, title, price, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        product.id,
        product.title,
        product.price,
        product.active ? 1 : 0,
        product.createdAt,
        product.updatedAt,
      );

    return product;
  }

  save(product: Product): Product {
    this.database
      .prepare(
        `
          UPDATE products
          SET title = ?,
              price = ?,
              active = ?,
              created_at = ?,
              updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        product.title,
        product.price,
        product.active ? 1 : 0,
        product.createdAt,
        product.updatedAt,
        product.id,
      );

    return product;
  }

  private mapRowToProduct(row: ProductRow): Product {
    return {
      id: row.id,
      title: row.title,
      price: row.price,
      active: Boolean(row.active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
