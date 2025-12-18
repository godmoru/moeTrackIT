'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class Budget extends Model {
    static associate(models) {
      // Association with MDA
      Budget.belongsTo(models.Mda, {
        foreignKey: 'mdaId',
        as: 'mda',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      // Association with BudgetLineItems
      Budget.hasMany(models.BudgetLineItem, {
        foreignKey: 'budgetId',
        as: 'lineItems',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      // Association with Expenditures
      Budget.hasMany(models.Expenditure, {
        foreignKey: 'budgetId',
        as: 'expenditures',
        onDelete: 'RESTRICT', // Prevent deleting budget with expenditures
        onUpdate: 'CASCADE'
      });
      
      // Association with BudgetVersion
      Budget.belongsTo(models.BudgetVersion, {
        foreignKey: 'versionId',
        as: 'version',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }

  Budget.init(
    {
      id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
        defaultValue: 'draft'
      },
      totalAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0
      },
      mdaId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'mdas',
          key: 'id'
        }
      },
      versionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'budget_versions',
          key: 'id'
        }
      }
    },
    {
      sequelize,
      modelName: 'Budget',
      tableName: 'budgets',
      timestamps: true,
      underscored: true
    }
  );

  return Budget;
};