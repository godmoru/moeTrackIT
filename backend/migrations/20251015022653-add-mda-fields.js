/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  // Add new columns to MDAs table
  await queryInterface.addColumn('Mdas', 'is_active', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  });

  await queryInterface.addColumn('Mdas', 'logo_url', {
    type: Sequelize.STRING,
    allowNull: true
  });

  await queryInterface.addColumn('Mdas', 'parent_ministry_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'Mdas',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  // Add index for better performance on parent_ministry_id
  await queryInterface.addIndex('Mdas', ['parent_ministry_id']);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('Mdas', 'is_active');
  await queryInterface.removeColumn('Mdas', 'logo_url');
  await queryInterface.removeColumn('Mdas', 'parent_ministry_id');};
