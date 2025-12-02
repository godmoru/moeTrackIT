'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const passwordHash = bcrypt.hashSync('Admin@123', 10);

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          name: 'System Super Admin',
          email: 'admin@edu.be.gov.ng',
          passwordHash,
          role: 'super_admin',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'System Admin',
          email: 'admin2@edu.be.gov.ng',
          passwordHash,
          role: 'admin',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'Users',
      { email: 'admin@edu.be.gov.ng' },
      { email: 'admin2@edu.be.gov.ng'}
    );
  },
};
