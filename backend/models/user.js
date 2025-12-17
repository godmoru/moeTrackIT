'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Assessment, { foreignKey: 'createdBy', as: 'assessments' });
      User.hasMany(models.Payment, { foreignKey: 'recordedBy', as: 'recordedPayments' });
      User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'userId' });

      // Scope associations for principals (single entity)
      User.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });

      // Legacy single LGA reference (kept for backward compatibility)
      User.belongsTo(models.Lga, { foreignKey: 'lgaId', as: 'primaryLga' });

      // Many-to-many with LGA via UserLga for AEO assignments (supports multiple LGAs)
      User.belongsToMany(models.Lga, {
        through: models.UserLga,
        foreignKey: 'userId',
        otherKey: 'lgaId',
        as: 'assignedLgas',
      });

      // Many-to-many with Role via UserRole
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'Roles',
      });
    }
  }

  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      passwordHash: DataTypes.STRING,
      role: DataTypes.STRING,
      status: DataTypes.STRING,
      lgaId: DataTypes.INTEGER,
      entityId: DataTypes.INTEGER,
      resetToken: DataTypes.STRING,
      resetTokenExpiry: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'User',
    }
  );

  return User;
};