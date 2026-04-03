const resolveDatabasePath = ({
  resolvePath,
  env,
}) => resolvePath(env.ORDERS_DB_PATH, 'data/orders.sqlite');

const createSchema = ({ database }) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      source_cart_id TEXT,
      payment_json TEXT
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_title_snapshot TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items(order_id)
  `);
};

const clearTable = ({ database }) => {
  database.exec('DELETE FROM order_items');
  database.exec('DELETE FROM orders');
};

const generateRecord = ({ index, now }) => {
  const suffix = index + 1;
  const orderId =
    suffix === 1 ? 'order-ready-to-confirm-1' : `order-ready-to-confirm-${suffix}`;

  const items = [
    {
      id: `${orderId}-item-1`,
      productId: 'seed-product-monitor',
      productTitleSnapshot: 'Monitor Gamer 27',
      unitPrice: 420,
      quantity: 1,
    },
    {
      id: `${orderId}-item-2`,
      productId: 'seed-product-keyboard',
      productTitleSnapshot: 'Teclado Mecanico TKL',
      unitPrice: 95,
      quantity: 2,
    },
    {
      id: `${orderId}-item-3`,
      productId: 'seed-product-mouse',
      productTitleSnapshot: 'Mouse Inalambrico Pro',
      unitPrice: 58,
      quantity: 1,
    },
  ].map((item) => ({
    ...item,
    lineTotal: Number((item.unitPrice * item.quantity).toFixed(2)),
  }));

  return {
    id: orderId,
    customerName: 'Cliente Seeder Demo',
    amount: Number(
      items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2),
    ),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    sourceCartId: 'cart-seed-ready-1',
    paymentJson: null,
    items,
  };
};

const insertRecord = ({ database, statement, record }) => {
  statement.run(
    record.id,
    record.customerName,
    record.amount,
    record.status,
    record.createdAt,
    record.updatedAt,
    record.sourceCartId,
    record.paymentJson,
  );

  const insertItem = database.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, product_title_snapshot, unit_price, quantity, line_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of record.items) {
    insertItem.run(
      item.id,
      record.id,
      item.productId,
      item.productTitleSnapshot,
      item.unitPrice,
      item.quantity,
      item.lineTotal,
    );
  }
};

module.exports = {
  entity: 'orders-ready',
  resolveDatabasePath,
  createSchema,
  clearTable,
  insertSql: `
    INSERT INTO orders (
      id, customer_name, amount, status, created_at, updated_at, source_cart_id, payment_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  generateRecord,
  insertRecord,
};
