'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }

    // Mark notification as read
    async markAsRead() {
      this.isRead = true;
      this.readAt = new Date();
      await this.save();
      return this;
    }
  }

  Notification.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'payment', 'assessment', 'system'),
        defaultValue: 'info',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
    }
  );

  return Notification;
};
