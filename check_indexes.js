const { sequelize } = require('./backend/models');

async function checkIndexes() {
  try {
    const [results] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'Roles';
    `);
    
    console.log('--- Indexes on Roles table ---');
    results.forEach(idx => {
      console.log(`Name: ${idx.indexname}`);
      console.log(`Def:  ${idx.indexdef}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking indexes:', err);
    process.exit(1);
  }
}

checkIndexes();
