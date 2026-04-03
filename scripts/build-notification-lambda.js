const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

async function main() {
  const entryPoint = path.join(
    process.cwd(),
    'lambda/notification-email/src/handler.ts',
  );
  const outdir = path.join(process.cwd(), 'dist-lambda/notification-email');

  fs.mkdirSync(outdir, { recursive: true });

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(outdir, 'index.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    logLevel: 'info',
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
