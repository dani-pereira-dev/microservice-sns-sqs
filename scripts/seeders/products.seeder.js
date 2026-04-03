const crypto = require('node:crypto');

const productAdjectives = [
  'Smart',
  'Basic',
  'Pro',
  'Lite',
  'Ultra',
  'Mini',
  'Max',
  'Eco',
  'Prime',
  'Go',
];

const productNouns = [
  'Notebook',
  'Auriculares',
  'Mouse',
  'Teclado',
  'Monitor',
  'Celular',
  'Tablet',
  'Camara',
  'Parlante',
  'Cargador',
];

const resolveDatabasePath = ({
  resolvePath,
  env,
}) => resolvePath(env.PRODUCTS_DB_PATH, 'data/products.sqlite');

const createSchema = ({ database }) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      active INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
};

const clearTable = ({ database }) => {
  database.exec('DELETE FROM products');
};

const generateRecord = ({ index, now }) => {
  const adjective = productAdjectives[index % productAdjectives.length];
  const noun = productNouns[index % productNouns.length];
  const version = Math.floor(index / productNouns.length) + 1;
  const basePrice = 25 + (index % 50) * 7;

  return {
    id: crypto.randomUUID(),
    title: `${adjective} ${noun} ${version}`,
    price: Number((basePrice + version * 1.5).toFixed(2)),
    active: 1,
    createdAt: now,
    updatedAt: now,
  };
};

const insertRecord = ({ statement, record }) => {
  statement.run(
    record.id,
    record.title,
    record.price,
    record.active,
    record.createdAt,
    record.updatedAt,
  );
};

module.exports = {
  entity: 'products',
  resolveDatabasePath,
  createSchema,
  clearTable,
  insertSql: `
    INSERT INTO products (id, title, price, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  generateRecord,
  insertRecord,
};
