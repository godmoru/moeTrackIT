'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class Attachment extends Model {
    static associate(models) {
      // Association with Expenditure
      Attachment.belongsTo(models.Expenditure, {
        foreignKey: 'expenditureId',
        as: 'expenditure',
        onDelete: 'CASCADE', // Delete attachment if expenditure is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with ExpenditureRetirement
      Attachment.belongsTo(models.ExpenditureRetirement, {
        foreignKey: 'retirementId',
        as: 'retirement',
        onDelete: 'CASCADE', // Delete attachment if retirement is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with User who uploaded the attachment
      Attachment.belongsTo(models.User, {
        foreignKey: 'uploadedBy',
        as: 'uploader',
        onDelete: 'RESTRICT', // Prevent deleting users who uploaded files
        onUpdate: 'CASCADE'
      });
    }
  }
  
  Attachment.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    documentType: {
      type: DataTypes.ENUM('invoice', 'receipt', 'approval', 'contract', 'report', 'other'),
      allowNull: false,
      comment: 'Type of document for categorization'
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'MIME type of the file'
    },
    storagePath: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Path where the file is stored in storage'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expenditureId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'expenditures',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Reference to the related expenditure (if any)'
    },
    retirementId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'expenditure_retirements',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Reference to the related retirement (if any)'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      comment: 'User who uploaded the file'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Attachment',
    tableName: 'attachments',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['expenditure_id'] },
      { fields: ['retirement_id'] },
      { fields: ['uploaded_by'] },
      { fields: ['document_type'] },
      { fields: ['file_type'] }
    ],
  });

  return Attachment;
};
