/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  const [results] = await queryInterface.sequelize.query(
    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
    "WHERE TABLE_NAME = 'Users' AND CONSTRAINT_NAME = 'fk_user_mda'"
  );

  if (results.length === 0) {
    await queryInterface.addConstraint('Users', {
      fields: ['mdaId'],
      type: 'foreign key',
      name: 'fk_user_mda',
      references: {
        table: 'Mdas',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    console.log('Added foreign key constraint fk_user_mda');
  } else {
    console.log('Foreign key constraint fk_user_mda already exists');
  }
},

  down: async (queryInterface, Sequelize) => {
  try {
    await queryInterface.removeConstraint('Users', 'fk_user_mda');
  } catch (error) {
    console.log('Constraint fk_user_mda does not exist, skipping removal');
  }
}
};