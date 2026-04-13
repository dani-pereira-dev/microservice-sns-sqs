/**
 * One-off: último snapshot por agregado en `product_events` → Put en DynamoDB.
 *
 * Requiere: PRODUCTS_DATABASE_URL, PRODUCTS_PROJECTION_TABLE_NAME, AWS_REGION (y credenciales).
 * Opcional: AWS_ENDPOINT (LocalStack).
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { Client } = require('pg');
const { buildProductsPgClientConfig } = require('./lib/products-pg-connection');
const { loadLocalEnvironment } = require('./load-env');

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`${name} es obligatoria para este script.`);
  }
  return v;
}

function isProductRow(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const p = payload;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.price === 'number' &&
    typeof p.active === 'boolean' &&
    typeof p.createdAt === 'string' &&
    typeof p.updatedAt === 'string'
  );
}

async function main() {
  loadLocalEnvironment();

  const tableName = requireEnv('PRODUCTS_PROJECTION_TABLE_NAME');
  const region = process.env.AWS_REGION || 'us-east-1';
  const endpoint = process.env.AWS_ENDPOINT || undefined;

  const pg = new Client(buildProductsPgClientConfig(process.env));
  await pg.connect();

  const base = new DynamoDBClient({ region, endpoint });
  const doc = DynamoDBDocumentClient.from(base);

  try {
    const { rows } = await pg.query(`
      SELECT DISTINCT ON (aggregate_id) aggregate_id, payload
      FROM product_events
      ORDER BY aggregate_id, version DESC
    `);

    let ok = 0;
    let skipped = 0;

    for (const row of rows) {
      const payload = row.payload;
      if (!isProductRow(payload)) {
        console.warn(
          `Omitido aggregate_id=${row.aggregate_id}: payload no es un Product válido.`,
        );
        skipped += 1;
        continue;
      }

      await doc.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            id: payload.id,
            title: payload.title,
            price: payload.price,
            active: payload.active,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
          },
        }),
      );
      ok += 1;
    }

    console.log(
      `Backfill Dynamo: ${ok} ítems escritos, ${skipped} omitidos, ${rows.length} agregados considerados.`,
    );
  } finally {
    await pg.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
