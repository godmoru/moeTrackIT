'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExpenditureCategory extends Model {
        static associate(models) {
            
            // ExpenditureCategory has many expenditures
            ExpenditureCategory.hasMany(models.Expenditure, {
                foreignKey: 'expenditureCategoryId',
                as: 'categoryId'
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

    ExpenditureCategory.init(
        {
            id: {
                type: DataTypes.INTEGER,
                defaultValue: DataTypes.INTEGER,
                primaryKey: true,
            },
            
            reference: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            cat_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
           
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('active', 'suspended', ),
                defaultValue: 'active',
            },
          
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        },
        {
            sequelize,
            modelName: 'ExpenditureCategory',
            tableName: 'ExpenditureCategories',
            timestamps: true,
        }
    );

    return ExpenditureCategory;
};
