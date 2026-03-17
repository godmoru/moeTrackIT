'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add studentPopulation to Entities
    const entitiesInfo = await queryInterface.describeTable('Entities');
    if (!entitiesInfo.studentPopulation) {
      await queryInterface.addColumn('Entities', 'studentPopulation', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Add amountType to IncomeSources
    const incomeSourcesInfo = await queryInterface.describeTable('IncomeSources');
    if (!incomeSourcesInfo.amountType) {
      await queryInterface.addColumn('IncomeSources', 'amountType', {
        type: Sequelize.ENUM('fixed', 'population_based'),
        defaultValue: 'fixed',
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Entities', 'studentPopulation');
    await queryInterface.removeColumn('IncomeSources', 'amountType');
    // Drop the ENUM type if needed (Postgres specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_IncomeSources_amountType";');
  }
};
