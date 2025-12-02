'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Entity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Entity.hasMany(models.Assessment, { foreignKey: 'entityId', as: 'assessments' });
      Entity.belongsTo(models.EntityType, { foreignKey: 'entityTypeId', as: 'entityType' });
      Entity.belongsTo(models.EntityOwnership, { foreignKey: 'entityOwnershipId', as: 'ownershipType' });
    }
  }
  Entity.init({
    name: DataTypes.STRING,
    entityTypeId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    subType: DataTypes.STRING,
    ownership: DataTypes.STRING,
    entityOwnershipId: DataTypes.INTEGER,
    state: DataTypes.STRING,
    lga: DataTypes.STRING,
    contactPerson: DataTypes.STRING,
    contactPhone: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    status: DataTypes.STRING,
    code: DataTypes.STRING,
    category: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Entity',
  });
  return Entity;
};