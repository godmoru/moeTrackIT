'use strict';

const { sequelize } = require('./models');

async function applyChanges() {
  console.log('Applying database schema changes...');
  
  try {
    // 1. Add studentPopulation to Entities
    try {
      await sequelize.query('ALTER TABLE "Entities" ADD COLUMN IF NOT EXISTS "studentPopulation" INTEGER;');
      console.log('✅ Added studentPopulation to Entities');
    } catch (err) {
      console.error('Error adding studentPopulation:', err.message);
    }

    // 2. Add amountType to IncomeSources
    // First, create the type if it doesn't exist
    try {
      // Check if type exists
      const [results] = await sequelize.query("SELECT 1 FROM pg_type WHERE typname = 'enum_IncomeSources_amountType';");
      if (results.length === 0) {
        await sequelize.query("CREATE TYPE \"enum_IncomeSources_amountType\" AS ENUM('fixed', 'population_based');");
        console.log('✅ Created ENUM type enum_IncomeSources_amountType');
      } else {
        console.log('ℹ️ ENUM type enum_IncomeSources_amountType already exists');
      }
    } catch (err) {
      console.error('Error creating ENUM type:', err.message);
    }

    try {
      await sequelize.query('ALTER TABLE "IncomeSources" ADD COLUMN IF NOT EXISTS "amountType" "enum_IncomeSources_amountType" DEFAULT \'fixed\' NOT NULL;');
      console.log('✅ Added amountType to IncomeSources');
    } catch (err) {
      console.error('Error adding amountType:', err.message);
    }

    console.log('Schema changes applied successfully.');
  } catch (error) {
    console.error('Failed to apply schema changes:', error);
  } finally {
    await sequelize.close();
  }
}

applyChanges();
