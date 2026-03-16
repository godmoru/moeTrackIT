'use strict';

const { IncomeSourceParameter, IncomeSource } = require('./models');

async function checkParams() {
  try {
    const params = await IncomeSourceParameter.findAll({
      include: [{ model: IncomeSource, as: 'incomeSource' }]
    });
    console.log(JSON.stringify(params, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

checkParams();
