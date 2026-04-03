const { spawn, spawnSync } = require('node:child_process');

const SERVICES = [
  {
    name: 'orders',
    script: 'start:dev:orders',
    patterns: ['apps/orders/src/main.ts', 'dist/orders/main.js'],
  },
  {
    name: 'payments',
    script: 'start:dev:payments',
    patterns: ['apps/payments/src/main.ts', 'dist/payments/main.js'],
  },
  {
    name: 'notification',
    script: 'start:dev:notification',
    patterns: ['apps/notification/src/main.ts', 'dist/notification/main.js'],
  },
];

const children = [];
let isShuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function killExistingProcesses() {
  const processes = readProcesses();
  const pidsToKill = new Set();

  for (const processInfo of processes) {
    if (!processInfo.pid || processInfo.pid === process.pid) {
      continue;
    }

    const matchesService = SERVICES.some((service) =>
      service.patterns.some((pattern) => processInfo.command.includes(pattern)),
    );

    if (matchesService) {
      pidsToKill.add(processInfo.pid);
    }
  }

  if (pidsToKill.size === 0) {
    return;
  }

  console.log(`Stopping previous services: ${Array.from(pidsToKill).join(', ')}`);

  for (const pid of pidsToKill) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  }

  await sleep(1500);

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

function startService(service) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCommand, ['run', service.script], {
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    console.error(
      `${service.name} stopped unexpectedly (code: ${code ?? 'null'}, signal: ${
        signal ?? 'null'
      })`,
    );

    shutdown(code ?? 1);
  });
}

function stopChild(child) {
  if (!child.pid) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      process.kill(child.pid, 'SIGTERM');
      return;
    }

    process.kill(-child.pid, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    stopChild(child);
  }

  setTimeout(() => process.exit(exitCode), 300);
}

async function main() {
  await killExistingProcesses();

  for (const service of SERVICES) {
    console.log(`Starting ${service.name}...`);
    startService(service);
  }

  console.log('All services are starting in dev mode.');
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
