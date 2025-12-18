'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class Expenditure extends Model {
    static associate(models) {
      // Association with Budget
      Expenditure.belongsTo(models.Budget, {
        foreignKey: 'budgetId',
        as: 'budget',
        onDelete: 'RESTRICT', // Prevent deleting budget with expenditures
        onUpdate: 'CASCADE'
      });
      
      // Association with BudgetLineItem
      Expenditure.belongsTo(models.BudgetLineItem, {
        foreignKey: 'budgetLineItemId',
        as: 'budgetLineItem',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // Association with User who created the expenditure
      Expenditure.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'RESTRICT', // Prevent deleting users who created expenditures
        onUpdate: 'CASCADE'
      });
      
      // Association with User who approved the expenditure
      Expenditure.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      
      // Association with Attachments
      Expenditure.hasMany(models.Attachment, {
        foreignKey: 'expenditureId',
        as: 'attachments',
        onDelete: 'CASCADE', // Delete attachments when expenditure is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with Retirement
      Expenditure.hasOne(models.ExpenditureRetirement, {
        foreignKey: 'expenditureId',
        as: 'retirement',
        onDelete: 'CASCADE', // Delete retirement when expenditure is deleted
        onUpdate: 'CASCADE'
      });
    }
  }
  
  Expenditure.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expenditureDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'retired'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'other'),
      allowNull: false,
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    budgetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Budgets',
        key: 'id',
      },
    },
    budgetLineItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'budget_line_items',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Expenditure',
    tableName: 'expenditures',
    timestamps: true,
    paranoid: true,
  });

  return Expenditure;
};
