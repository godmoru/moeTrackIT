const { Entity, EntityType, EntityOwnership } = require('./models');

async function test() {
  try {
    console.log('Fetching Entities with includes...');
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });
    console.log('Success! Found', entities.length, 'Entities');
    process.exit(0);
  } catch (err) {
    console.error('Error fetching Entities:');
    console.error(err);
    process.exit(1);
  }
}

test();
