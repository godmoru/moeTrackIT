'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {
      // No associations for now
    }
  }
  Setting.init(
    {
      portalTitle: DataTypes.STRING,
      invoiceFooter: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Setting',
    }
  );
  return Setting;
};
