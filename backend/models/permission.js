'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      Permission.belongsToMany(models.Role, {
        through: models.RolePermission,
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        as: 'roles',
      });
    }
  }

  Permission.init(
    {
      name: DataTypes.STRING,
      code: {
        type: DataTypes.STRING,
        unique: true,
      },
      module: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Permission',
    },
  );

  return Permission;
};
