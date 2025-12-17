'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserLgas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      lgaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Lgas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Unique constraint: one user can only be assigned to an LGA once
    await queryInterface.addIndex('UserLgas', ['userId', 'lgaId'], {
      unique: true,
      name: 'user_lga_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserLgas');
  },
};
