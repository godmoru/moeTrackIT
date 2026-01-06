'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class RetirementAttachment extends Model {
        static associate(models) {
            // Retirement attachment belongs to a retirement
            RetirementAttachment.belongsTo(models.ExpenditureRetirement, {
                foreignKey: 'retirementId',
                as: 'retirement'
            });

            // Retirement attachment uploaded by user
            RetirementAttachment.belongsTo(models.User, {
                foreignKey: 'uploadedBy',
                as: 'uploader'
            });

            // Retirement attachment verified by user
            RetirementAttachment.belongsTo(models.User, {
                foreignKey: 'verifiedBy',
                as: 'verifier'
            });
        }

        /**
         * Get file size in human-readable format
         */
        getFileSizeFormatted() {
            const bytes = this.fileSize;
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        /**
         * Check if file is an image
         */
        isImage() {
            const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            return imageTypes.includes(this.fileType.toLowerCase());
        }

        /**
         * Check if file is a PDF
         */
        isPDF() {
            return this.fileType.toLowerCase() === 'application/pdf';
        }
    }

    RetirementAttachment.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            retirementId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'ExpenditureRetirements',
                    key: 'id'
                }
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
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            documentType: {
                type: DataTypes.ENUM('receipt', 'invoice', 'delivery_note', 'payment_proof', 'other'),
                allowNull: false,
                defaultValue: 'other',
            },
            amount: {
                type: DataTypes.DECIMAL(20, 2),
                allowNull: true,
                comment: 'Amount associated with this specific document'
            },
            uploadedBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            verifiedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            verifiedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            verificationNotes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
        },
        {
            sequelize,
            modelName: 'RetirementAttachment',
            tableName: 'RetirementAttachments',
            timestamps: true,
        }
    );

    return RetirementAttachment;
};
