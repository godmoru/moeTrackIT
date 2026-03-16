'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add expenditureCategoryId to Expenditures table
    await queryInterface.addColumn('Expenditures', 'expenditureCategoryId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null first to avoid errors with existing data
      references: {
        model: 'ExpenditureCategories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // We can't easily set a default if there are existing records without a valid category ID.
    // However, we know there's at least one category with ID 1.
    await queryInterface.sequelize.query('UPDATE "Expenditures" SET "expenditureCategoryId" = 1 WHERE "expenditureCategoryId" IS NULL');

    // Now make it non-nullable if desired, but let's keep it nullable if there's any doubt about existing data.
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Expenditures', 'expenditureCategoryId');
  }
};
