import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { formatCartLog } from '@shared/logging/log-format.utils';

@Injectable()
export class CartDatabase {
  private readonly logger = new Logger(CartDatabase.name);
  readonly connection: Database.Database;

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

    this.connection = new Database(databasePath);
    this.connection.pragma('journal_mode = WAL');
    this.connection.pragma('synchronous = NORMAL');

    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        checked_out_order_id TEXT
      )
    `);

    this.connection.exec(`
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

    this.connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id
      ON cart_items(cart_id)
    `);

    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS product_projections (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        active INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    this.logger.log(
      formatCartLog(`SQLite persistence enabled at ${databasePath}.`),
    );
  }
}
