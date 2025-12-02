'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Permissions', {
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
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      module: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.bulkInsert('Permissions', [
      { name: 'View Users', code: 'users.view', module: 'users', description: 'View user list and details', createdAt: now, updatedAt: now },
      { name: 'Manage Users', code: 'users.manage', module: 'users', description: 'Create and update users', createdAt: now, updatedAt: now },
      { name: 'View Settings', code: 'settings.view', module: 'settings', description: 'View system settings', createdAt: now, updatedAt: now },
      { name: 'Manage Settings', code: 'settings.manage', module: 'settings', description: 'Update system settings', createdAt: now, updatedAt: now },
      { name: 'View Assessments', code: 'assessments.view', module: 'assessments', description: 'View assessments', createdAt: now, updatedAt: now },
      { name: 'Manage Assessments', code: 'assessments.manage', module: 'assessments', description: 'Create and update assessments', createdAt: now, updatedAt: now },
      { name: 'View Payments', code: 'payments.view', module: 'payments', description: 'View payments and invoices', createdAt: now, updatedAt: now },
      { name: 'Manage Payments', code: 'payments.manage', module: 'payments', description: 'Record and update payments', createdAt: now, updatedAt: now },
      { name: 'View Reports', code: 'reports.view', module: 'reports', description: 'View reports and analytics', createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Permissions');
  },
};
