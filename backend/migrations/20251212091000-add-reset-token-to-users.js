'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('Users');

    if (!tableDesc.resetToken) {
      await queryInterface.addColumn('Users', 'resetToken', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDesc.resetTokenExpiry) {
      await queryInterface.addColumn('Users', 'resetTokenExpiry', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('Users');
    
    if (tableDesc.resetTokenExpiry) {
      await queryInterface.removeColumn('Users', 'resetTokenExpiry');
    }
    if (tableDesc.resetToken) {
      await queryInterface.removeColumn('Users', 'resetToken');
    }
  },
};
