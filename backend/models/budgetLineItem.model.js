import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class BudgetLineItem extends Model {
    static associate(models) {
      // Association with Budget
      BudgetLineItem.belongsTo(models.Budget, {
        foreignKey: 'budgetId',
        as: 'budget',
        onDelete: 'CASCADE', // Delete line items when budget is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with Expenditures
      BudgetLineItem.hasMany(models.Expenditure, {
        foreignKey: 'budgetLineItemId',
        as: 'expenditures',
        onDelete: 'RESTRICT', // Prevent deleting line items with expenditures
        onUpdate: 'CASCADE'
      });
    }
  }

  BudgetLineItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      budgetId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Category of the budget line item (e.g., Personnel, Operations, Capital)'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        comment: 'User who created this line item'
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'User who last updated this line item'
      }
    },
    {
      sequelize,
      modelName: 'BudgetLineItem',
      tableName: 'budget_line_items',
      timestamps: true,
      underscored: true
    }
  );

  return BudgetLineItem;
};