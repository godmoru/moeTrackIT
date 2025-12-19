/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    // Check if the constraint already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = '${queryInterface.sequelize.config.database}' 
       AND TABLE_NAME = 'Users' 
       AND COLUMN_NAME = 'mdaId' 
       AND CONSTRAINT_NAME = 'Users_mdaId_fkey'`,
      { transaction }
    );

    // If the constraint doesn't exist, add it
    if (results.length === 0) {
      await queryInterface.addConstraint('Users', {
        fields: ['mdaId'],
        type: 'foreign key',
        name: 'Users_mdaId_fkey',
        references: {
          table: 'Mdas',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        transaction
      });
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.removeConstraint('Users', 'Users_mdaId_fkey');
}
};
