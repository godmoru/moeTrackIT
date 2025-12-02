'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Assessments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Entities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      incomeSourceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'IncomeSources',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      amountAssessed: {
        type: Sequelize.DECIMAL
      },
      currency: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      dueDate: {
        type: Sequelize.DATE
      },
      assessmentPeriod: {
        type: Sequelize.STRING
      },
      meta: {
        type: Sequelize.JSON
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Assessments');
  }
};