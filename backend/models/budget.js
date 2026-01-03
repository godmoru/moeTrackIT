'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    static associate(models) {
      // Budget belongs to an MDA
      Budget.belongsTo(models.Mda, { 
        foreignKey: 'mdaId', 
        as: 'mda' 
      });

      // Budget has many line items
      Budget.hasMany(models.BudgetLineItem, { 
        foreignKey: 'budgetId', 
        as: 'lineItems' 
      });

      // Budget has many expenditures (through line items)
      Budget.hasMany(models.Expenditure, { 
        foreignKey: 'budgetId', 
        as: 'expenditures' 
      });

      // Budget created by user
      Budget.belongsTo(models.User, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
      });

      // Budget approved by user
      Budget.belongsTo(models.User, { 
        foreignKey: 'approvedBy', 
        as: 'approver' 
      });

      // Budget updated by user
      Budget.belongsTo(models.User, { 
        foreignKey: 'updatedBy', 
        as: 'updater' 
      });
    }

    /**
     * Calculate total amount from line items
     */
    async calculateTotal() {
      const lineItems = await this.getLineItems();
      const total = lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      return total;
    }

    /**
     * Calculate total spent from approved expenditures
     */
    async calculateSpent() {
      const expenditures = await this.getExpenditures({
        where: { status: 'approved' }
      });
      const spent = expenditures.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      return spent;
    }

    /**
     * Get budget utilization percentage
     */
    async getUtilizationPercentage() {
      const total = parseFloat(this.totalAmount || 0);
      if (total === 0) return 0;
      
      const spent = await this.calculateSpent();
      return (spent / total) * 100;
    }
  }

  Budget.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      mdaId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Mdas',
          key: 'id'
        }
      },
      fiscalYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'published'),
        defaultValue: 'draft',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      approvedAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Budget',
      tableName: 'Budgets',
      timestamps: true,
    }
  );

  return Budget;
};
