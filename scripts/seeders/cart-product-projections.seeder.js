const { buildSeedProductRecord } = require('./product-fixtures');

const resolveDatabasePath = ({
  resolvePath,
  env,
}) => resolvePath(env.CART_DB_PATH, 'data/cart.sqlite');

const createSchema = ({ database }) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS product_projections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      active INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
};

const clearTable = ({ database }) => {
  database.exec('DELETE FROM product_projections');
};

const generateRecord = ({ index, now }) => {
  const product = buildSeedProductRecord({ index, now });

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    active: product.active,
    updatedAt: product.updatedAt,
  };
};

const insertRecord = ({ statement, record }) => {
  statement.run(
    record.id,
    record.title,
    record.price,
    record.active,
    record.updatedAt,
  );
};

module.exports = {
  entity: 'cart-product-projections',
  resolveDatabasePath,
  createSchema,
  clearTable,
  insertSql: `
    INSERT INTO product_projections (id, title, price, active, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  generateRecord,
  insertRecord,
};
