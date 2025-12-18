'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  
  class ApprovalHistory extends Model {
    static associate(models) {
      // Define associations here
      ApprovalHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }

  ApprovalHistory.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // metadata: {
    //   type: DataTypes.JSONB,
    //   allowNull: true
    // }

    metadata: {
  type: DataTypes.TEXT,  // Changed from JSONB to TEXT
  allowNull: true,
  get() {
    const rawValue = this.getDataValue('metadata');
    return rawValue ? JSON.parse(rawValue) : {};
  },
  set(value) {
    this.setDataValue('metadata', JSON.stringify(value || {}));
  }
}
  }, {
    sequelize,
    modelName: 'ApprovalHistory',
    tableName: 'approval_histories',
    underscored: true,
    paranoid: true,
  });

  return ApprovalHistory;
};