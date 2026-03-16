'use strict';

const { Entity, IncomeSource, Assessment, sequelize } = require('./models');
const { calculateAssessmentAmount, createAssessmentWithCalculation } = require('./src/services/assessmentService');

async function runTest() {
  console.log('Starting dynamic calculation verification...');
  
  try {
    // 1. Create a test entity (institution)
    const entity = await Entity.create({
      name: 'Test School for Calculation',
      type: 'school',
      status: 'active',
      studentPopulation: 100
    });
    console.log(`Created test entity with population: ${entity.studentPopulation}`);

    // 2. Create a population-based income source
    const incomeSource = await IncomeSource.create({
      name: 'Sport Levy (Test)',
      code: 'SL-TEST',
      category: 'recurring',
      recurrence: 'yearly',
      defaultAmount: 50, // 50 NGN per student
      amountType: 'population_based',
      active: true
    });
    console.log(`Created income source with amountType: ${incomeSource.amountType} and defaultAmount: ${incomeSource.defaultAmount}`);

    // 3. Calculate should be 100 * 50 = 5000
    const result = await calculateAssessmentAmount(entity.id, incomeSource.id);
    console.log(`Calculation Result: ${result.amount}`);
    
    if (result.amount === 5000) {
      console.log('✅ Success: Amount calculated correctly (100 * 50 = 5000)');
    } else {
      console.error(`❌ Failure: Amount expected 5000, but got ${result.amount}`);
    }

    // 4. Test fixed amount
    const fixedSource = await IncomeSource.create({
      name: 'Admin Fee (Test)',
      code: 'AF-TEST',
      category: 'one_time',
      recurrence: 'none',
      defaultAmount: 2000,
      amountType: 'fixed',
      active: true
    });
    const fixedResult = await calculateAssessmentAmount(entity.id, fixedSource.id);
    console.log(`Fixed Calculation Result: ${fixedResult.amount}`);
    
    if (fixedResult.amount === 2000) {
       console.log('✅ Success: Fixed amount calculated correctly');
    } else {
       console.error(`❌ Failure: Fixed amount expected 2000, but got ${fixedResult.amount}`);
    }

    // Cleanup
    await Assessment.destroy({ where: { entityId: entity.id } });
    await incomeSource.destroy();
    await fixedSource.destroy();
    await entity.destroy();
    console.log('Cleanup completed.');

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await sequelize.close();
  }
}

runTest();
