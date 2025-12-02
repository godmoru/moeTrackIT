'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EntityOwnership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EntityOwnership.hasMany(models.Entity, { foreignKey: 'entityOwnershipId', as: 'entities' });
    }
  }
  EntityOwnership.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EntityOwnership',
  });
  return EntityOwnership;
};