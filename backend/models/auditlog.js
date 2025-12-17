'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  AuditLog.init(
    {
      userId: DataTypes.INTEGER,
      userName: DataTypes.STRING,
      userEmail: DataTypes.STRING,
      userRole: DataTypes.STRING,
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resourceId: DataTypes.STRING,
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      statusCode: DataTypes.INTEGER,
      ipAddress: DataTypes.STRING,
      country: DataTypes.STRING,
      region: DataTypes.STRING,
      city: DataTypes.STRING,
      latitude: DataTypes.FLOAT,
      longitude: DataTypes.FLOAT,
      timezone: DataTypes.STRING,
      isp: DataTypes.STRING,
      userAgent: DataTypes.TEXT,
      requestBody: DataTypes.TEXT,
      responseMessage: DataTypes.TEXT,
      details: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'AuditLog',
    }
  );

  return AuditLog;
};
