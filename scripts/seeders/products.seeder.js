const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { buildProductsPgClientConfig } = require('../lib/products-pg-connection');
const { buildSeedProductRecord } = require('./product-fixtures');

const PRODUCT_CREATED_EVENT = 'product.created';

/**
 * Siembra eventos `product.created` en Postgres en AWS (tabla product_events).
 * Requiere PRODUCTS_DATABASE_URL. TLS: `scripts/lib/products-pg-connection.js`.
 */
async function runPostgresSeed({ count, clear, env }) {
  const client = new Client(buildProductsPgClientConfig(env));
  await client.connect();

  try {
    if (clear) {
      await client.query('DELETE FROM product_events');
    }

    const now = new Date().toISOString();
    const insertSql = `
      INSERT INTO product_events (id, aggregate_id, type, payload, version, created_at, published_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, now(), now())
    `;

    for (let index = 0; index < count; index += 1) {
      const fixture = buildSeedProductRecord({ index, now });
      const payload = {
        id: fixture.id,
        title: fixture.title,
        price: fixture.price,
        active: Boolean(fixture.active),
        createdAt: fixture.createdAt,
        updatedAt: fixture.updatedAt,
      };

      await client.query(insertSql, [
        randomUUID(),
        payload.id,
        PRODUCT_CREATED_EVENT,
        JSON.stringify(payload),
        1,
      ]);
    }
  } finally {
    await client.end();
  }
}

module.exports = {
  entity: 'products',
  runPostgresSeed,
};
