const productsSeeder = require('./products.seeder');
const cartProductProjectionsSeeder = require('./cart-product-projections.seeder');
const ordersReadySeeder = require('./orders-ready.seeder');

const seeders = new Map([
  [productsSeeder.entity, productsSeeder],
  [cartProductProjectionsSeeder.entity, cartProductProjectionsSeeder],
  [ordersReadySeeder.entity, ordersReadySeeder],
]);

const getSeeder = (entity) => seeders.get(entity);

const listSeeders = () => Array.from(seeders.keys()).sort();

module.exports = {
  getSeeder,
  listSeeders,
};
