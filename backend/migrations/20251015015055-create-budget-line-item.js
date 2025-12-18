/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('BudgetLineItems', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    code: {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    budgetId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Budgets',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    mdaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Mdas',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    category: {
      type: Sequelize.ENUM('personnel', 'overhead', 'recurrent', 'capital'),
      allowNull: false
    },
    amount: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    balance: {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    fiscalYear: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    quarter: {
      type: Sequelize.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
      allowNull: false
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
};