'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExpenditureCategory extends Model {
        static associate(models) {
        // ExpenditureCategory has many expenditures
        ExpenditureCategory.hasMany(models.Expenditure, {
            foreignKey: 'expenditureCategoryId',
            as: 'expenditures'
        });

        // ExpenditureCategory belongs to creator
        ExpenditureCategory.belongsTo(models.User, {
            foreignKey: 'createdBy',
            as: 'creator'
        });
    }

        /**
         * Check if category is active
         */
        isActive() {
            return this.status === 'active';
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
