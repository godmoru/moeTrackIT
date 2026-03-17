'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Mdas');
    if (!tableInfo.type) {
      await queryInterface.addColumn('Mdas', 'type', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Mdas');
    if (tableInfo.type) {
      await queryInterface.removeColumn('Mdas', 'type');
    }
  }
};
