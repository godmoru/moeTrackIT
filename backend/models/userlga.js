'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserLga extends Model {
    static associate(models) {
      UserLga.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      UserLga.belongsTo(models.Lga, { foreignKey: 'lgaId', as: 'lga' });
      UserLga.belongsTo(models.User, { foreignKey: 'assignedBy', as: 'assigner' });
    }
  }

  UserLga.init(
    {
      userId: DataTypes.INTEGER,
      lgaId: DataTypes.INTEGER,
      assignedAt: DataTypes.DATE,
      assignedBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'UserLga',
    }
  );

  return UserLga;
};
