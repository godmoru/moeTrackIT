'use strict';

const { sequelize } = require('./models');

async function applyChanges() {
  console.log('Applying assessment period schema changes...');
  
  try {
    await sequelize.query('ALTER TABLE "Assessments" ADD COLUMN IF NOT EXISTS "assessmentYear" INTEGER;');
    console.log('✅ Added assessmentYear to Assessments');
    
    await sequelize.query('ALTER TABLE "Assessments" ADD COLUMN IF NOT EXISTS "assessmentTerm" INTEGER;');
    console.log('✅ Added assessmentTerm to Assessments');

    console.log('Schema changes applied successfully.');
  } catch (error) {
    console.error('Failed to apply schema changes:', error);
  } finally {
    await sequelize.close();
  }
}

applyChanges();
