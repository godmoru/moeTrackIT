'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add columns one by one and ignore "already exists" errors so this
    // migration is safe to run even if some columns were added manually.
    const table = 'Entities';

    const addIfMissing = async (column, definition) => {
      try {
        await queryInterface.addColumn(table, column, definition);
      } catch (err) {
        if (err && err.message && err.message.includes('already exists')) {
          // Column already present, safe to ignore.
          return;
        }
        throw err;
      }
    };

    await addIfMissing('code', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addIfMissing('category', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addIfMissing('address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn('Entities', 'code'),
      queryInterface.removeColumn('Entities', 'category'),
      queryInterface.removeColumn('Entities', 'address'),
    ]);
  },
};
