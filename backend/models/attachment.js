'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Attachment extends Model {
        static associate(models) {
            // Attachment belongs to an expenditure
            Attachment.belongsTo(models.Expenditure, {
                foreignKey: 'expenditureId',
                as: 'expenditure'
            });

            // Attachment uploaded by user
            Attachment.belongsTo(models.User, {
                foreignKey: 'uploadedBy',
                as: 'uploader'
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

    Attachment.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            expenditureId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Expenditures',
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
                type: DataTypes.ENUM('approval', 'invoice', 'receipt', 'payment_voucher', 'delivery_note', 'other'),
                allowNull: false,
                defaultValue: 'other',
            },
            uploadedBy: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Attachment',
            tableName: 'Attachments',
            timestamps: true,
        }
    );

    return Attachment;
};
