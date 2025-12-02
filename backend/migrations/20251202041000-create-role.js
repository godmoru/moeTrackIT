'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    const now = new Date();
    await queryInterface.bulkInsert('Roles', [
      {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full access to all admin features, including user and settings management.',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Can manage operational data (assessments, payments, entities, reports).',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Officer',
        slug: 'officer',
        description: 'Limited access focused on day-to-day data entry and collections.',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Roles');
  },
};
