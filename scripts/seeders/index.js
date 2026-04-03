const productsSeeder = require('./products.seeder');

const seeders = new Map([[productsSeeder.entity, productsSeeder]]);

const getSeeder = (entity) => seeders.get(entity);

const listSeeders = () => Array.from(seeders.keys()).sort();

module.exports = {
  getSeeder,
  listSeeders,
};
