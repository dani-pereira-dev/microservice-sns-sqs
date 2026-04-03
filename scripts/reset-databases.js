const fs = require('node:fs');
const path = require('node:path');
const { loadLocalEnvironment } = require('./load-env');

function resolveDatabasePath(configuredPath, fallbackPath) {
  const finalPath = configuredPath || fallbackPath;

  return path.isAbsolute(finalPath)
    ? finalPath
    : path.join(process.cwd(), finalPath);
}

function removeIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`skip ${filePath} (not found)`);
    return;
  }

  fs.rmSync(filePath, { force: true });
  console.log(`removed ${filePath}`);
}

function main() {
  loadLocalEnvironment();

  const ordersDbPath = resolveDatabasePath(
    process.env.ORDERS_DB_PATH,
    'data/orders.sqlite',
  );
  const paymentsDbPath = resolveDatabasePath(
    process.env.PAYMENTS_DB_PATH,
    'data/payments.sqlite',
  );
  const productsDbPath = resolveDatabasePath(
    process.env.PRODUCTS_DB_PATH,
    'data/products.sqlite',
  );
  const cartDbPath = resolveDatabasePath(
    process.env.CART_DB_PATH,
    'data/cart.sqlite',
  );

  removeIfExists(ordersDbPath);
  removeIfExists(`${ordersDbPath}-shm`);
  removeIfExists(`${ordersDbPath}-wal`);

  removeIfExists(paymentsDbPath);
  removeIfExists(`${paymentsDbPath}-shm`);
  removeIfExists(`${paymentsDbPath}-wal`);

  removeIfExists(productsDbPath);
  removeIfExists(`${productsDbPath}-shm`);
  removeIfExists(`${productsDbPath}-wal`);

  removeIfExists(cartDbPath);
  removeIfExists(`${cartDbPath}-shm`);
  removeIfExists(`${cartDbPath}-wal`);
}

main();
