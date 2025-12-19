'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Mda extends Model {
        static associate(models) {
            // MDA has many budgets
            Mda.hasMany(models.Budget, {
                foreignKey: 'mdaId',
                as: 'budgets'
            });

            // MDA has many budget line items
            Mda.hasMany(models.BudgetLineItem, {
                foreignKey: 'mdaId',
                as: 'lineItems'
            });

            // MDA has many expenditures
            Mda.hasMany(models.Expenditure, {
                foreignKey: 'mdaId',
                as: 'expenditures'
            });

            // MDA has many users
            Mda.hasMany(models.User, {
                foreignKey: 'mdaId',
                as: 'users'
            });
        }
    }

    Mda.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            phoneNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: 'Mda',
            tableName: 'Mdas',
            timestamps: true,
        }
    );

    return Mda;
};
