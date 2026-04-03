const fs = require('node:fs');
const path = require('node:path');

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
  const ordersDbPath = resolveDatabasePath(
    process.env.ORDERS_DB_PATH,
    'data/orders.sqlite',
  );
  const paymentsDbPath = resolveDatabasePath(
    process.env.PAYMENTS_DB_PATH,
    'data/payments.sqlite',
  );

  removeIfExists(ordersDbPath);
  removeIfExists(`${ordersDbPath}-shm`);
  removeIfExists(`${ordersDbPath}-wal`);

  removeIfExists(paymentsDbPath);
  removeIfExists(`${paymentsDbPath}-shm`);
  removeIfExists(`${paymentsDbPath}-wal`);
}

main();
