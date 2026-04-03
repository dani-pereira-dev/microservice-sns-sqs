const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { loadLocalEnvironment } = require('./load-env');

function main() {
  loadLocalEnvironment();

  const serverlessBinary = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'serverless.cmd' : 'serverless',
  );

  const args = process.argv.slice(2);

  execFileSync(serverlessBinary, args, {
    stdio: 'inherit',
    env: process.env,
  });
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
