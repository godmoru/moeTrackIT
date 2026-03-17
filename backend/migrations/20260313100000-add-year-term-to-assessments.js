'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Assessments');
    if (!tableInfo.assessmentYear) {
      await queryInterface.addColumn('Assessments', 'assessmentYear', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
    if (!tableInfo.assessmentTerm) {
      await queryInterface.addColumn('Assessments', 'assessmentTerm', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Assessments', 'assessmentYear');
    await queryInterface.removeColumn('Assessments', 'assessmentTerm');
  }
};
