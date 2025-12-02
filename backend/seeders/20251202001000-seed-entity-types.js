'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'EntityTypes',
      [
        { name: 'Creche & Pre School', description: 'Creche & pre-school educational institution', code: 'CRC', createdAt: now, updatedAt: now },
        { name: 'Primary School', description: 'Primary education institution', code: 'PRI', createdAt: now, updatedAt: now },
        { name: 'Secondary School', description: 'Secondary education institution', code: 'SEC', createdAt: now, updatedAt: now },
        { name: 'Tertiary Institution', description: 'Tertiary education institution', code: 'TER', createdAt: now, updatedAt: now },
        { name: 'Vendor', description: 'Education service vendor', code: 'VEN', createdAt: now, updatedAt: now },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('EntityTypes', null, {});
  },
};
