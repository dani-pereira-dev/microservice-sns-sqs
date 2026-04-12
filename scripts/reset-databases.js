const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadLocalEnvironment } = require('./load-env');

const SERVICE_PATTERNS = [
  'apps/orders/src/main.ts',
  'apps/payments/src/main.ts',
  'apps/products/src/main.ts',
  'apps/cart/src/main.ts',
  'apps/notification/src/main.ts',
];

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

function readProcesses() {
  const result = spawnSync('ps', ['-ax', '-o', 'pid=,command='], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [pidText, ...commandParts] = line.split(/\s+/);

      return {
        pid: Number(pidText),
        command: commandParts.join(' '),
      };
    });
}

function stopRunningServices() {
  const processes = readProcesses();
  const pidsToKill = processes
    .filter(
      (processInfo) =>
        processInfo.pid &&
        processInfo.pid !== process.pid &&
        SERVICE_PATTERNS.some((pattern) => processInfo.command.includes(pattern)),
    )
    .map((processInfo) => processInfo.pid);

  if (pidsToKill.length === 0) {
    return;
  }

  console.log(`stopping services before db reset: ${pidsToKill.join(', ')}`);

  for (const pid of pidsToKill) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  }

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);

  for (const pid of pidsToKill) {
    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  }
}

function main() {
  loadLocalEnvironment();
  stopRunningServices();

  const ordersDbPath = resolveDatabasePath(
    process.env.ORDERS_DB_PATH,
    'data/orders.sqlite',
  );
  const paymentsDbPath = resolveDatabasePath(
    process.env.PAYMENTS_DB_PATH,
    'data/payments.sqlite',
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

  removeIfExists(cartDbPath);
  removeIfExists(`${cartDbPath}-shm`);
  removeIfExists(`${cartDbPath}-wal`);
}

main();
