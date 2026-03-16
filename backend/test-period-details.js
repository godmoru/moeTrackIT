'use strict';

const { Entity, IncomeSource, Assessment, sequelize } = require('./models');
const { bulkCreate } = require('./src/controllers/assessmentController');

async function runTest() {
  console.log('Starting bulkCreate verification...');
  
  try {
    // 1. Setup test entity and income source
    const entity = await Entity.create({
      name: 'Bulk Test School',
      type: 'school',
      status: 'active'
    });

    const incomeSource = await IncomeSource.create({
      name: 'Bulk Termly Fee (Test)',
      code: 'BTF-TEST',
      category: 'recurring',
      recurrence: 'termly',
      defaultAmount: 1000,
      active: true
    });

    console.log('Test environment setup completed.');

    // 2. Mock req/res for bulkCreate
    const req = {
      body: {
        incomeSourceId: incomeSource.id,
        assessmentYear: 2026,
        assessmentTerm: 3,
        entityIds: [entity.id],
        onlyActive: true
      },
      user: { id: 2 }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    console.log('Testing bulkCreate with explicit Year/Term...');
    await bulkCreate(req, res);

    console.log(`Response status: ${res.statusCode}`);
    console.log('Response data:', JSON.stringify(res.data, null, 2));

    if (res.statusCode === 201 && res.data.createdCount === 1) {
      const assessment = await Assessment.findOne({ where: { entityId: entity.id, incomeSourceId: incomeSource.id } });
      console.log(`Assessment created: Period=${assessment.assessmentPeriod}, Year=${assessment.assessmentYear}, Term=${assessment.assessmentTerm}`);
      
      if (assessment.assessmentYear === 2026 && assessment.assessmentTerm === 3 && assessment.assessmentPeriod === '2026-T3') {
        console.log('✅ Success: Year and Term saved correctly via bulkCreate.');
      } else {
        console.error('❌ Failure: Year, Term, or Period mismatch.');
      }
    } else {
      console.error(`❌ Failure: Expected 201 status and 1 created assessment. Got ${res.statusCode} and ${res.data?.message || 'unknown error'}`);
    }

    // Cleanup
    await Assessment.destroy({ where: { entityId: entity.id } });
    await incomeSource.destroy();
    await entity.destroy();
    console.log('Cleanup completed.');

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await sequelize.close();
  }
}

runTest();
