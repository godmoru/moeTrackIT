'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'EntityOwnerships',
      [
        { name: 'Public', description: 'Government owned', createdAt: now, updatedAt: now },
        { name: 'Private', description: 'Privately owned', createdAt: now, updatedAt: now },
        { name: 'Mission', description: 'Faith-based or mission school', createdAt: now, updatedAt: now },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('EntityOwnerships', null, {});
  },
};
