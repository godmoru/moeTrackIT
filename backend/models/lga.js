'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Lga extends Model {
    static associate(models) {
      Lga.hasMany(models.Entity, { foreignKey: 'lgaId', as: 'entities' });

      // Many-to-many with User via UserLga for AEO assignments
      Lga.belongsToMany(models.User, {
        through: models.UserLga,
        foreignKey: 'lgaId',
        otherKey: 'userId',
        as: 'assignedUsers',
      });
    }
  }
  Lga.init(
    {
      name: DataTypes.STRING,
      state: DataTypes.STRING,
      code: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Lga',
    }
  );
  return Lga;
};