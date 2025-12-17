'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('UserLgas');
    
    if (!tableDescription.isCurrent) {
      await queryInterface.addColumn('UserLgas', 'isCurrent', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!tableDescription.removedAt) {
      await queryInterface.addColumn('UserLgas', 'removedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.removedBy) {
      await queryInterface.addColumn('UserLgas', 'removedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    await queryInterface.removeIndex('UserLgas', 'user_lga_unique');

    await queryInterface.addIndex('UserLgas', ['userId', 'lgaId'], {
      unique: true,
      name: 'user_lga_unique_current',
      where: { isCurrent: true },
    });

    await queryInterface.addIndex('UserLgas', ['userId'], {
      name: 'user_lga_user_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('UserLgas');
    
    await queryInterface.removeIndex('UserLgas', 'user_lga_user_id_idx');
    await queryInterface.removeIndex('UserLgas', 'user_lga_unique_current');

    await queryInterface.addIndex('UserLgas', ['userId', 'lgaId'], {
      unique: true,
      name: 'user_lga_unique',
    });

    if (tableDescription.removedBy) {
      await queryInterface.removeColumn('UserLgas', 'removedBy');
    }
    if (tableDescription.removedAt) {
      await queryInterface.removeColumn('UserLgas', 'removedAt');
    }
    if (tableDescription.isCurrent) {
      await queryInterface.removeColumn('UserLgas', 'isCurrent');
    }
  },
};
