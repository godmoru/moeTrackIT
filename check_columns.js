const { sequelize } = require('./backend/models');

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Roles';
    `);
    
    console.log('--- Columns on Roles table ---');
    results.forEach(col => {
      console.log(`Column: ${col.column_name.padEnd(15)} | Type: ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err);
    process.exit(1);
  }
}

checkColumns();
