'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userRole: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      resource: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      statusCode: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      requestBody: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      responseMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      details: {
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

    // Add indexes for common queries
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['action']);
    await queryInterface.addIndex('AuditLogs', ['resource']);
    await queryInterface.addIndex('AuditLogs', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuditLogs');
  },
};
