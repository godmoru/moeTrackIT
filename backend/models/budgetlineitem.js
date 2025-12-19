'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class BudgetLineItem extends Model {
        static associate(models) {
            // Line item belongs to a budget
            BudgetLineItem.belongsTo(models.Budget, {
                foreignKey: 'budgetId',
                as: 'budget'
            });

            // Line item belongs to an MDA
            BudgetLineItem.belongsTo(models.Mda, {
                foreignKey: 'mdaId',
                as: 'mda'
            });

            // Line item has many expenditures
            BudgetLineItem.hasMany(models.Expenditure, {
                foreignKey: 'budgetLineItemId',
                as: 'expenditures'
            });
        }

        /**
         * Calculate balance from approved expenditures
         */
        async calculateBalance() {
            const expenditures = await this.getExpenditures({
                where: { status: 'approved' }
            });
            const spent = expenditures.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
            const balance = parseFloat(this.amount || 0) - spent;
            return balance;
        }

        /**
         * Get utilization percentage
         */
        async getUtilizationPercentage() {
            const amount = parseFloat(this.amount || 0);
            if (amount === 0) return 0;

            const balance = await this.calculateBalance();
            const spent = amount - balance;
            return (spent / amount) * 100;
        }

        /**
         * Check if expenditure amount is within available balance
         */
        async canAccommodateExpenditure(expenditureAmount) {
            const balance = await this.calculateBalance();
            return parseFloat(expenditureAmount) <= balance;
        }

        /**
         * Get early warning threshold status
         */
        async getWarningStatus() {
            const utilization = await this.getUtilizationPercentage();

            if (utilization >= 95) return { level: 'critical', threshold: 95 };
            if (utilization >= 85) return { level: 'high', threshold: 85 };
            if (utilization >= 75) return { level: 'medium', threshold: 75 };
            return { level: 'normal', threshold: 0 };
        }
    }

    BudgetLineItem.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            code: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            budgetId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Budgets',
                    key: 'id'
                }
            },
            mdaId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Mdas',
                    key: 'id'
                }
            },
            category: {
                type: DataTypes.ENUM('personnel', 'overhead', 'recurrent', 'capital'),
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            balance: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            fiscalYear: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quarter: {
                type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'BudgetLineItem',
            tableName: 'BudgetLineItems',
            timestamps: true,
            hooks: {
                // Set initial balance to amount when creating
                beforeCreate: (lineItem) => {
                    if (!lineItem.balance) {
                        lineItem.balance = lineItem.amount;
                    }
                },
            },
        }
    );

    return BudgetLineItem;
};
