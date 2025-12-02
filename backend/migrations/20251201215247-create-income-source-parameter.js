'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IncomeSourceParameters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      incomeSourceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'IncomeSources',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      key: {
        type: Sequelize.STRING
      },
      label: {
        type: Sequelize.STRING
      },
      dataType: {
        type: Sequelize.STRING
      },
      required: {
        type: Sequelize.BOOLEAN
      },
      options: {
        type: Sequelize.JSON
      },
      calculationRole: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('IncomeSourceParameters');
  }
};