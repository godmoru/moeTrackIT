'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Assessment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Assessment.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Assessment.belongsTo(models.IncomeSource, { foreignKey: 'incomeSourceId', as: 'incomeSource' });
      Assessment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Assessment.hasMany(models.Payment, { foreignKey: 'assessmentId', as: 'payments' });
    }
  }
  Assessment.init({
    entityId: DataTypes.INTEGER,
    incomeSourceId: DataTypes.INTEGER,
    amountAssessed: DataTypes.DECIMAL,
    currency: DataTypes.STRING,
    status: DataTypes.STRING,
    dueDate: DataTypes.DATE,
    assessmentPeriod: DataTypes.STRING,
    meta: DataTypes.JSON,
    createdBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Assessment',
  });
  return Assessment;
};