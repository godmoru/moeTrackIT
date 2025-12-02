'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IncomeSource extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      IncomeSource.hasMany(models.IncomeSourceParameter, { foreignKey: 'incomeSourceId', as: 'parameters' });
      IncomeSource.hasMany(models.Assessment, { foreignKey: 'incomeSourceId', as: 'assessments' });
    }
  }
  IncomeSource.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    recurrence: DataTypes.STRING,
    defaultAmount: DataTypes.DECIMAL,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'IncomeSource',
  });
  return IncomeSource;
};