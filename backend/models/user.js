'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Assessment, { foreignKey: 'createdBy', as: 'assessments' });
      User.hasMany(models.Payment, { foreignKey: 'recordedBy', as: 'recordedPayments' });
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    role: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};