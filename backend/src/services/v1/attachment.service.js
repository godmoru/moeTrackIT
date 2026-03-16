'use strict';

const path = require('path');
const fs = require('fs').promises;
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');

class AttachmentService {
    /**
     * Upload an attachment for an expenditure
     */
    static async uploadAttachment(file, expenditureId, documentType, userId, description = null) {
        const transaction = await db.sequelize.transaction();

        try {
            // Check if expenditure exists
            const expenditure = await db.Expenditure.findByPk(expenditureId, { transaction });
            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            // Validate file
            this.validateFile(file);

            // Create attachment record
            const attachment = await db.Attachment.create(
                {
                    expenditureId,
                    fileName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    description,
                    documentType,
                    uploadedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return attachment;
        } catch (error) {
            await transaction.rollback();

            // Delete uploaded file if database operation failed
            if (file && file.path) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file after error:', unlinkError);
                }
            }

            throw error;
        }
    }

    /**
     * Upload an attachment for a retirement
     */
    static async uploadRetirementAttachment(file, retirementId, documentType, userId, description = null) {
        const transaction = await db.sequelize.transaction();

        try {
            // Check if retirement exists
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, { transaction });
            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            // Validate file
            this.validateFile(file);

            // Create attachment record
            const attachment = await db.RetirementAttachment.create(
                {
                    retirementId,
                    fileName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    description,
                    documentType,
                    uploadedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return attachment;
        } catch (error) {
            await transaction.rollback();

            // Delete uploaded file if database operation failed
            if (file && file.path) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file after error:', unlinkError);
                }
            }

            throw error;
        }
    }

    /**
     * Get attachments for an expenditure
     */
    static async getAttachmentsByExpenditure(expenditureId) {
        return await db.Attachment.findAll({
            where: { expenditureId },
            include: [
                {
                    model: db.User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Get attachments for a retirement
     */
    static async getAttachmentsByRetirement(retirementId) {
        return await db.RetirementAttachment.findAll({
            where: { retirementId },
            include: [
                {
                    model: db.User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Get a single attachment by ID
     */
    static async getAttachmentById(attachmentId) {
        const attachment = await db.Attachment.findByPk(attachmentId, {
            include: [
                {
                    model: db.User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (!attachment) {
            throw new AppError('Attachment not found', 404);
        }

        return attachment;
    }

    /**
     * Get a single retirement attachment by ID
     */
    static async getRetirementAttachmentById(attachmentId) {
        const attachment = await db.RetirementAttachment.findByPk(attachmentId, {
            include: [
                {
                    model: db.User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (!attachment) {
            throw new AppError('Retirement attachment not found', 404);
        }

        return attachment;
    }

    /**
     * Delete an attachment
     */
    static async deleteAttachment(attachmentId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const attachment = await db.Attachment.findByPk(attachmentId, { transaction });

            if (!attachment) {
                throw new AppError('Attachment not found', 404);
            }

            // Delete file from filesystem
            try {
                await fs.unlink(attachment.filePath);
            } catch (fileError) {
                console.error('Failed to delete file from filesystem:', fileError);
            }

            // Delete database record
            await attachment.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete a retirement attachment
     */
    static async deleteRetirementAttachment(attachmentId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const attachment = await db.RetirementAttachment.findByPk(attachmentId, { transaction });

            if (!attachment) {
                throw new AppError('Retirement attachment not found', 404);
            }

            // Delete file from filesystem
            try {
                await fs.unlink(attachment.filePath);
            } catch (fileError) {
                console.error('Failed to delete file from filesystem:', fileError);
            }

            // Delete database record
            await attachment.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Validate uploaded file
     */
    static validateFile(file) {
        if (!file) {
            throw new AppError('No file provided', 400);
        }

        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new AppError(
                'Invalid file type. Allowed types: PDF, JPEG, JPG, PNG, GIF',
                400
            );
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new AppError('File size exceeds 10MB limit', 400);
        }
    }

    /**
     * Get file download path
     */
    static async getFileDownloadPath(attachmentId) {
        const attachment = await this.getAttachmentById(attachmentId);
        return {
            filePath: attachment.filePath,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
        };
    }

    /**
     * Get retirement file download path
     */
    static async getRetirementFileDownloadPath(attachmentId) {
        const attachment = await this.getRetirementAttachmentById(attachmentId);
        return {
            filePath: attachment.filePath,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
        };
    }
}

module.exports = AttachmentService;
