'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Expenditure extends Model {
        static associate(models) {
            // Expenditure belongs to a budget line item
            Expenditure.belongsTo(models.BudgetLineItem, {
                foreignKey: 'budgetLineItemId',
                as: 'lineItem'
            });

            // Expenditure belongs to a budget (for easier querying)
            Expenditure.belongsTo(models.Budget, {
                foreignKey: 'budgetId',
                as: 'budget'
            });

            // Expenditure belongs to an MDA
            Expenditure.belongsTo(models.Mda, {
                foreignKey: 'mdaId',
                as: 'mda'
            });

            // Expenditure created by user
            Expenditure.belongsTo(models.User, {
                foreignKey: 'createdBy',
                as: 'creator'
            });

            // Expenditure approved by user
            Expenditure.belongsTo(models.User, {
                foreignKey: 'approvedBy',
                as: 'approver'
            });

            // Expenditure updated by user
            Expenditure.belongsTo(models.User, {
                foreignKey: 'updatedBy',
                as: 'updater'
            });

            // Expenditure has many attachments
            Expenditure.hasMany(models.Attachment, {
                foreignKey: 'expenditureId',
                as: 'attachments'
            });

            // Expenditure has one retirement
            Expenditure.hasOne(models.ExpenditureRetirement, {
                foreignKey: 'expenditureId',
                as: 'retirement'
            });
        }

        /**
         * Generate unique reference number
         */
        static async generateReferenceNumber() {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');

            // Find the last expenditure for this month
            const lastExpenditure = await Expenditure.findOne({
                where: sequelize.where(
                    sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'),
                    `${year}-${month}`
                ),
                order: [['createdAt', 'DESC']],
            });

            let sequence = 1;
            if (lastExpenditure && lastExpenditure.referenceNumber) {
                const lastSequence = parseInt(lastExpenditure.referenceNumber.split('-').pop());
                sequence = lastSequence + 1;
            }

            return `EXP-${year}${month}-${String(sequence).padStart(4, '0')}`;
        }

        /**
         * Check if expenditure can be edited
         */
        canEdit() {
            return this.status === 'draft';
        }

        /**
         * Check if expenditure can be deleted
         */
        canDelete() {
            return this.status === 'draft';
        }

        /**
         * Check if expenditure can be approved
         */
        canApprove() {
            return this.status === 'submitted';
        }
    }

    Expenditure.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            budgetLineItemId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'BudgetLineItems',
                    key: 'id'
                }
            },
            budgetId: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
            amount: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            referenceNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            status: {
                type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
                defaultValue: 'draft',
            },
            approvedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            approvedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            rejectionReason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            paymentVoucherNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            paymentVoucherDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            paymentVoucherAmount: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: true,
            },
            paymentVoucherDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            paymentDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            beneficiaryName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            beneficiaryAccountNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            beneficiaryBank: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            updatedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Expenditure',
            tableName: 'Expenditures',
            timestamps: true,
        }
    );

    return Expenditure;
};
