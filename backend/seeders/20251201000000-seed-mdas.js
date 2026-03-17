'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Mdas', [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Ministry of Education',
        code: 'MOE',
        type: 'ministry',
        address: 'State Secretariat, Makurdi',
        email: 'info@edu.be.gov.ng',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Benue State University',
        code: 'BSU',
        type: 'agency',
        address: 'Makurdi',
        email: 'info@bsu.edu.ng',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Mdas', null, {});
  }
};
