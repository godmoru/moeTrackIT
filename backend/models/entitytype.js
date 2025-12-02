'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EntityType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EntityType.hasMany(models.Entity, { foreignKey: 'entityTypeId', as: 'entities' });
    }
  }
  EntityType.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    code: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EntityType',
  });
  return EntityType;
};