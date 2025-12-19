/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Budgets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      mdaId: {
        type: Sequelize.UUID,
        allowNull: true,  // Changed from false to true
        references: {
          model: 'Mdas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fiscalYear: {
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected', 'published'),
        defaultValue: 'draft'
      },
      startDate: {
        type: Sequelize.DATEONLY
      },
      endDate: {
        type: Sequelize.DATEONLY
      },
      totalAmount: {
        type: Sequelize.DECIMAL
      },
      approvedAmount: {
        type: Sequelize.DECIMAL
      },
      approvedBy: {
        type: Sequelize.UUID
      },
      approvedAt: {
        type: Sequelize.DATE
      },
      createdBy: {
        type: Sequelize.UUID
      },
      updatedBy: {
        type: Sequelize.UUID
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
},

  down: async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Budgets');
}
};