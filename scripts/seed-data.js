const path = require('node:path');
const { mkdirSync } = require('node:fs');
const Database = require('better-sqlite3');
const { loadLocalEnvironment } = require('./load-env');
const { getSeeder, listSeeders } = require('./seeders');

const parseArgs = (argv) => {
  const options = {
    entity: '',
    count: 5000,
    clear: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--entity' && argv[index + 1]) {
      options.entity = argv[index + 1];
      index += 1;
      continue;
    }

    if (current === '--count' && argv[index + 1]) {
      options.count = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--append') {
      options.clear = false;
    }
  }

  return options;
};

const resolvePath = (configuredPath, fallbackPath) => {
  const finalPath = configuredPath || fallbackPath;

  return path.isAbsolute(finalPath)
    ? finalPath
    : path.join(process.cwd(), finalPath);
};

const validateOptions = ({ entity, count }) => {
  if (!entity) {
    throw new Error(
      `Missing --entity. Available entities: ${listSeeders().join(', ')}`,
    );
  }

  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('--count must be an integer greater than 0.');
  }
};

const main = () => {
  loadLocalEnvironment();

  const options = parseArgs(process.argv.slice(2));
  validateOptions(options);

  const seeder = getSeeder(options.entity);

  if (!seeder) {
    throw new Error(
      `Unknown entity "${options.entity}". Available entities: ${listSeeders().join(', ')}`,
    );
  }

  const databasePath = seeder.resolveDatabasePath({
    resolvePath,
    env: process.env,
  });

  mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma('journal_mode = WAL');
  database.pragma('synchronous = NORMAL');

  seeder.createSchema({ database });

  if (options.clear) {
    seeder.clearTable({ database });
  }

  const now = new Date().toISOString();
  const insertStatement = database.prepare(seeder.insertSql);
  const insertMany = database.transaction((records) => {
    for (const record of records) {
      seeder.insertRecord({
        database,
        statement: insertStatement,
        record,
      });
    }
  });

  const records = Array.from({ length: options.count }, (_, index) =>
    seeder.generateRecord({
      index,
      now,
    }),
  );

  insertMany(records);

  console.log(
    `Seeded ${records.length} ${options.entity} records into ${databasePath}${options.clear ? ' (table cleared first)' : ''}.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
