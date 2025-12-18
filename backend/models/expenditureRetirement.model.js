'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class ExpenditureRetirement extends Model {
    static associate(models) {
      // Association with Expenditure
      ExpenditureRetirement.belongsTo(models.Expenditure, {
        foreignKey: 'expenditureId',
        as: 'expenditure',
        onDelete: 'CASCADE', // Delete retirement if expenditure is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with User who created the retirement
      ExpenditureRetirement.belongsTo(models.User, {
        foreignKey: 'retiredBy',
        as: 'retiree',
        onDelete: 'RESTRICT', // Prevent deleting users who created retirements
        onUpdate: 'CASCADE'
      });
      
      // Association with User who approved the retirement
      ExpenditureRetirement.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      
      // Association with RetirementAttachments
      ExpenditureRetirement.hasMany(models.RetirementAttachment, {
        foreignKey: 'retirementId',
        as: 'attachments',
        onDelete: 'CASCADE', // Delete attachments when retirement is deleted
        onUpdate: 'CASCADE'
      });
    }
  }
  
  ExpenditureRetirement.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    retirementNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    retirementDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    amountRetired: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    expenditureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'expenditures',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Reference to the expenditure being retired'
    },
    retiredBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      comment: 'User who created the retirement'
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'User who approved the retirement'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'ExpenditureRetirement',
    tableName: 'expenditure_retirements',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['expenditure_id'] },
      { fields: ['retired_by'] },
      { fields: ['approved_by'] },
      { fields: ['status'] },
      { fields: ['retirement_number'], unique: true }
    ],
  });

  return ExpenditureRetirement;
};
