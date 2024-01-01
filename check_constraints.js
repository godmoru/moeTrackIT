const { sequelize } = require('./backend/models');

async function checkConstraints() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        tc.table_name, kcu.column_name, tc.constraint_name, tc.constraint_type
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE' 
        AND tc.table_name IN ('Roles', 'Permissions', 'Users');
    `);
    
    console.log('--- Unique Constraints ---');
    console.table(results);
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking constraints:', err);
    process.exit(1);
  }
}

checkConstraints();
