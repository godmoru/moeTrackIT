`'use strict';

const { options } = require('../src/routes/auth');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [sourceRows] = await queryInterface.sequelize.query(
      "SELECT id, code FROM \"IncomeSources\" WHERE code IN ('NSR','ALR', 'SL', 'WF', 'ITI')"
    );
    const nsr = sourceRows.find((s) => s.code === 'NSR');
    const alr = sourceRows.find((s) => s.code === 'ALR');
    const sl = sourceRows.find((s) => s.code === 'SL');
    const wf = sourceRows.find((s) => s.code === 'WF');
    const iti = sourceRows.find((s) => s.code === 'ITI');

    const params = [];

    if (nsr) {
      params.push(
        {
          incomeSourceId: nsr.id,
          key: 'school_level',
          label: 'School Level',
          dataType: 'enum',
          required: true,
          options: JSON.stringify({ values: ['primary', 'secondary'] }),
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
          key: 'year',
          label: 'Year',
          dataType: 'number',
          required: true,
          options: null, // Could add range validaiton here later
          calculationRole: 'period_year',
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    if (sl) {
      params.push(
        {
          incomeSourceId: sl.id,
          key: 'year',
          label: 'Year',
          dataType: 'number',
          required: true,
          options: null,
          calculationRole: 'period_year',
          createdAt: now,
          updatedAt: now,
        },
        {
          incomeSourceId: sl.id,
          key: 'term',
          label: 'Term',
          dataType: 'enum',
          required: true,
          options: JSON.stringify({ values: ['1', '2', '3'] }),
          calculationRole: 'period_term',
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    if (wf) {
      params.push(
        {
          incomeSourceId: wf.id,
          key: 'year',
          label: 'Year',
          dataType: 'number',
          required: true,
          options: null,
          calculationRole: 'period_year',
          createdAt: now,
          updatedAt: now,
        },
        {
          incomeSourceId: wf.id,
          key: 'term',
          label: 'Term',
          dataType: 'enum',
          required: true,
          options: JSON.stringify({ values: ['1', '2', '3'] }),
          calculationRole: 'period_term',
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    if (iti) {
      params.push(
        {
          incomeSourceId: iti.id,
          key: 'year',
          label: 'Year',
          dataType: 'number',
          required: true,
          options: null,
          calculationRole: 'period_year',
          createdAt: now,
          updatedAt: now,
        },
        {
          incomeSourceId: iti.id,
          key: 'term',
          label: 'Term',
          dataType: 'enum',
          required: true,
          options: JSON.stringify({ values: ['1', '2', '3'] }),
          calculationRole: 'period_term',
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
      { key: ['school_level', 'base_amount', 'student_count', 'year', 'term'] },
      {}
    );
  },
};
