'use strict';

const { options } = require('../src/routes/auth');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [sourceRows] = await queryInterface.sequelize.query(
      "SELECT id, code FROM \"IncomeSources\" WHERE code IN ('NSR','ALR')"
    );
    const nsr = sourceRows.find((s) => s.code === 'NSR');
    const alr = sourceRows.find((s) => s.code === 'ALR');

    const params = [];

    if (nsr) {
      params.push(
        {
          incomeSourceId: nsr.id,
          key: 'school_level',
          label: 'School Level',
          dataType: 'enum',
          required: true,
          options: null,
        //   options: { values: ['primary', 'secondary'] },
          calculationRole: 'info',
          createdAt: now,
          updatedAt: now,
        },
        {
          incomeSourceId: nsr.id,
          key: 'base_amount',
          label: 'Base Amount Override',
          dataType: 'number',
          required: false,
          options: null,
          calculationRole: 'base_amount',
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    if (alr) {
      params.push(
        {
          incomeSourceId: alr.id,
          key: 'student_count',
          label: 'Student Count',
          dataType: 'number',
          required: false,
          options: null,
          calculationRole: 'multiplier',
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    if (params.length) {
      await queryInterface.bulkInsert('IncomeSourceParameters', params, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'IncomeSourceParameters',
      { key: ['school_level', 'base_amount', 'student_count'] },
      {}
    );
  },
};
