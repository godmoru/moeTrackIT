'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add studentPopulation to Entities
    await queryInterface.addColumn('Entities', 'studentPopulation', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add amountType to IncomeSources
    // Note: Creating ENUM type in Postgres can be tricky in migrations if it already exists, 
    // but here we are adding a new column with a new enum type.
    await queryInterface.addColumn('IncomeSources', 'amountType', {
      type: Sequelize.ENUM('fixed', 'population_based'),
      defaultValue: 'fixed',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Entities', 'studentPopulation');
    await queryInterface.removeColumn('IncomeSources', 'amountType');
    // Drop the ENUM type if needed (Postgres specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_IncomeSources_amountType";');
  }
};
