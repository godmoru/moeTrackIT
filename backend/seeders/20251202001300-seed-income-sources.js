'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'IncomeSources',
      [
        {
          name: 'New School Registration',
          code: 'NSR',
          description: 'One-time registration fee for new schools',
          category: 'one_time',
          recurrence: 'none',
          defaultAmount: 200000,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Annual License Renewal',
          code: 'ALR',
          description: 'Yearly license renewal for approved schools',
          category: 'recurring',
          recurrence: 'yearly',
          defaultAmount: 50000,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Sport Levy',
          code: 'SL',
          description: 'Termly sport levy across all schools',
          category: 'recurring',
          recurrence: 'termly',
          defaultAmount: 1000,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Workshop Fee',
          code: 'WF',
          description: 'Recurring workshop fee',
          category: 'recurring',
          recurrence: 'termly',
          defaultAmount: 500,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'IT Infrastructure',
          code: 'ITI',
          description: 'Levy for IT infrastructure maintenance',
          category: 'recurring',
          recurrence: 'termly',
          defaultAmount: 1500,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('IncomeSources', { code: ['NSR', 'ALR', 'SL', 'WF', 'ITI'] }, {});
  },
};
