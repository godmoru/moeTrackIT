'use strict';
import { Model } from 'sequelize';

export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  class RetirementAttachment extends Model {
    static associate(models) {
      // Association with ExpenditureRetirement
      RetirementAttachment.belongsTo(models.ExpenditureRetirement, {
        foreignKey: 'retirementId',
        as: 'retirement',
        onDelete: 'CASCADE', // Delete attachment if retirement is deleted
        onUpdate: 'CASCADE'
      });
      
      // Association with User who uploaded the attachment
      RetirementAttachment.belongsTo(models.User, {
        foreignKey: 'uploadedBy',
        as: 'uploader',
        onDelete: 'RESTRICT', // Prevent deleting users who uploaded files
        onUpdate: 'CASCADE'
      });
      
      // Association with User who verified the attachment
      RetirementAttachment.belongsTo(models.User, {
        foreignKey: 'verifiedBy',
        as: 'verifier',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }
  
  RetirementAttachment.init({
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
      type: DataTypes.ENUM('receipt', 'invoice', 'approval', 'proof_of_payment', 'delivery_note', 'other'),
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
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes from the verifier'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    retirementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'expenditure_retirements',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Reference to the related retirement'
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
    modelName: 'RetirementAttachment',
    tableName: 'retirement_attachments',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['retirement_id'] },
      { fields: ['uploaded_by'] },
      { fields: ['verified_by'] },
      { fields: ['document_type'] },
      { fields: ['file_type'] },
      { fields: ['verified'] }
    ],
  });

  return RetirementAttachment;
};
