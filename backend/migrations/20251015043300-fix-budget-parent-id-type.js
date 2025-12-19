export default {
  async up(queryInterface, Sequelize) {
    // First, remove the foreign key constraint if it exists
    await queryInterface.sequelize.query(
      'ALTER TABLE `budgets` DROP FOREIGN KEY IF EXISTS `budgets_parent_id_foreign_idx`;'
    );

    // Change the parent_id column type to match the id column type (INTEGER)
    await queryInterface.changeColumn('budgets', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Budgets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change if needed
    await queryInterface.sequelize.query(
      'ALTER TABLE `budgets` DROP FOREIGN KEY IF EXISTS `budgets_parent_id_foreign_idx`;'
    );
    
    await queryInterface.changeColumn('budgets', 'parent_id', {
      type: Sequelize.CHAR(36).BINARY,
      allowNull: true
    });
  }
}
};
