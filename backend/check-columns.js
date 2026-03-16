'use strict';

const { sequelize } = require('./models');

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Assessments'
    `);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

checkColumns();
