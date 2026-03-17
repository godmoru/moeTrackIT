const { Lga, Entity } = require('./models');

async function test() {
  try {
    const lgas = await Lga.findAll({ limit: 1 });
    console.log('Sample LGA:', JSON.stringify(lgas[0], null, 2));
    
    const entities = await Entity.findAll({ limit: 1 });
    console.log('Sample Entity:', JSON.stringify(entities[0], null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
