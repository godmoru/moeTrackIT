'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExpenditureRetirement extends Model {
        static associate(models) {
            // Retirement belongs to an expenditure
            ExpenditureRetirement.belongsTo(models.Expenditure, {
                foreignKey: 'expenditureId',
                as: 'expenditure'
            });

            // Retirement created by user
            ExpenditureRetirement.belongsTo(models.User, {
                foreignKey: 'createdBy',
                as: 'creator'
            });

            // Retirement reviewed by user
            ExpenditureRetirement.belongsTo(models.User, {
                foreignKey: 'reviewedBy',
                as: 'reviewer'
            });

            // Retirement approved by user
            ExpenditureRetirement.belongsTo(models.User, {
                foreignKey: 'approvedBy',
                as: 'approver'
            });

            // Retirement updated by user
            ExpenditureRetirement.belongsTo(models.User, {
                foreignKey: 'updatedBy',
                as: 'updater'
            });

            // Retirement has many attachments
            ExpenditureRetirement.hasMany(models.RetirementAttachment, {
                foreignKey: 'retirementId',
                as: 'attachments'
            });
        }

        /**
         * Generate unique retirement number
         */
        static async generateRetirementNumber() {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');

            // Find the last retirement for this month
            const lastRetirement = await ExpenditureRetirement.findOne({
                where: sequelize.where(
                    sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'),
                    `${year}-${month}`
                ),
                order: [['createdAt', 'DESC']],
            });

            let sequence = 1;
            if (lastRetirement && lastRetirement.retirementNumber) {
                const lastSequence = parseInt(lastRetirement.retirementNumber.split('-').pop());
                sequence = lastSequence + 1;
            }

            return `RET-${year}${month}-${String(sequence).padStart(4, '0')}`;
        }

        /**
         * Check if retirement can be edited
         */
        canEdit() {
            return this.status === 'draft';
        }

        /**
         * Check if retirement can be deleted
         */
        canDelete() {
            return this.status === 'draft';
        }

        /**
         * Check if retirement can be reviewed
         */
        canReview() {
            return this.status === 'submitted';
        }

        /**
         * Check if retirement can be approved
         */
        canApprove() {
            return this.status === 'under_review';
        }
    }

    ExpenditureRetirement.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            expenditureId: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'Expenditures',
                    key: 'id'
                }
            },
            retirementNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            retirementDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            status: {
                type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'),
                defaultValue: 'draft',
            },
            amountRetired: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: false,
            },
            balanceUnretired: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            purpose: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            rejectionReason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            reviewedBy: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            reviewedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            approvedBy: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            approvedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            createdBy: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            updatedBy: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'ExpenditureRetirement',
            tableName: 'ExpenditureRetirements',
            timestamps: true,
        }
    );

    return ExpenditureRetirement;
};
