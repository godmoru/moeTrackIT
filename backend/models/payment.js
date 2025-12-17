'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payment.belongsTo(models.Assessment, { foreignKey: 'assessmentId', as: 'assessment' });
      Payment.belongsTo(models.User, { foreignKey: 'recordedBy', as: 'recorder' });
    }
  }
  Payment.init({
    assessmentId: DataTypes.INTEGER,
    amountPaid: DataTypes.DECIMAL,
    paymentDate: DataTypes.DATE,
    method: DataTypes.STRING,
    reference: DataTypes.STRING,
    status: DataTypes.STRING,
    recordedBy: DataTypes.INTEGER,
    paystackReference: DataTypes.STRING,
    paystackAccessCode: DataTypes.STRING,
    channel: DataTypes.STRING,
    payerEmail: DataTypes.STRING,
    payerName: DataTypes.STRING,
    gatewayResponse: DataTypes.TEXT,
    paymentType: {
      type: DataTypes.STRING,
      defaultValue: 'manual',
    },
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};