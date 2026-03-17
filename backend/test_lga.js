const { Lga } = require('./models');

async function test() {
  try {
    console.log('Fetching LGAs...');
    const lgas = await Lga.findAll({ order: [['name', 'ASC']] });
    console.log('Success! Found', lgas.length, 'LGAs');
    process.exit(0);
  } catch (err) {
    console.error('Error fetching LGAs:');
    console.error(err);
    process.exit(1);
  }
}

test();
