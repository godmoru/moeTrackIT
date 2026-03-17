'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Payments');
    if (!tableInfo.rrr) {
      await queryInterface.addColumn('Payments', 'rrr', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Payments');
    if (tableInfo.rrr) {
      await queryInterface.removeColumn('Payments', 'rrr');
    }
  }
};
