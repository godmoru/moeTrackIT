'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist before adding
    const tableDesc = await queryInterface.describeTable('Users');

    if (!tableDesc.lgaId) {
      await queryInterface.addColumn('Users', 'lgaId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Lgas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!tableDesc.entityId) {
      await queryInterface.addColumn('Users', 'entityId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Entities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('Users');
    if (tableDesc.entityId) {
      await queryInterface.removeColumn('Users', 'entityId');
    }
    if (tableDesc.lgaId) {
      await queryInterface.removeColumn('Users', 'lgaId');
    }
  },
};
