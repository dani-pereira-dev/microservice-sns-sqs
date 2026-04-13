const { Client } = require('pg');
const { buildProductsPgClientConfig } = require('./lib/products-pg-connection');
const { loadLocalEnvironment } = require('./load-env');

async function main() {
  loadLocalEnvironment();
  const client = new Client(buildProductsPgClientConfig(process.env));
  await client.connect();

  try {
    const result = await client.query('DELETE FROM product_events');
    console.log(
      `Vacía product_events: ${result.rowCount ?? 0} filas eliminadas.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
