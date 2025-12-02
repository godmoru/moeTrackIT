'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IncomeSourceParameter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      IncomeSourceParameter.belongsTo(models.IncomeSource, { foreignKey: 'incomeSourceId', as: 'incomeSource' });
    }
  }
  IncomeSourceParameter.init({
    incomeSourceId: DataTypes.INTEGER,
    key: DataTypes.STRING,
    label: DataTypes.STRING,
    dataType: DataTypes.STRING,
    required: DataTypes.BOOLEAN,
    options: DataTypes.JSON,
    calculationRole: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'IncomeSourceParameter',
  });
  return IncomeSourceParameter;
};