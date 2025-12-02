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
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('IncomeSources', { code: ['NSR', 'ALR'] }, {});
  },
};
