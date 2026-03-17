const { Assessment, Entity, IncomeSource, Payment } = require('./models');

async function test() {
  try {
    console.log('Fetching Assessments with includes...');
    const assessments = await Assessment.findAll({
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });
    console.log('Success! Found', assessments.length, 'Assessments');
    process.exit(0);
  } catch (err) {
    console.error('Error fetching Assessments:');
    console.error(err);
    process.exit(1);
  }
}

test();
