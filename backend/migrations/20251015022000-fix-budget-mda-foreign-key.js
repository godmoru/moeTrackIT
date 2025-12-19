/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  // First remove the existing foreign key constraint
  await queryInterface.sequelize.query(
    'ALTER TABLE `Budgets` DROP FOREIGN KEY `budgets_ibfk_1`;'
  );
  
  // Then modify the mdaId column to allow null
  await queryInterface.changeColumn('Budgets', 'mdaId', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'Mdas',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
},

  down: async (queryInterface, Sequelize) => {
  // Revert the changes if needed
  await queryInterface.sequelize.query(
    'ALTER TABLE `Budgets` DROP FOREIGN KEY `budgets_ibfk_1`;'
  );
  
  await queryInterface.changeColumn('Budgets', 'mdaId', {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'Mdas',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE' // Changed from SET NULL to CASCADE for the rollback
  });
}
};
