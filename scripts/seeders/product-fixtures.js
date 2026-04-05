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

const buildSeedProductRecord = ({ index, now }) => {
  const adjective = productAdjectives[index % productAdjectives.length];
  const noun = productNouns[index % productNouns.length];
  const version = Math.floor(index / productNouns.length) + 1;
  const basePrice = 25 + (index % 50) * 7;

  return {
    id: `seed-product-${String(index + 1).padStart(4, '0')}`,
    title: `${adjective} ${noun} ${version}`,
    price: Number((basePrice + version * 1.5).toFixed(2)),
    active: 1,
    createdAt: now,
    updatedAt: now,
  };
};

module.exports = {
  buildSeedProductRecord,
};
