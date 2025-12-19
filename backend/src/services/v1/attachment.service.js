import path from 'path';
import fs from 'fs/promises';
import AppError from '../../utils/appError.js';
import db from '../../models/index.js';

class AttachmentService {
    /**
     * Upload an attachment for an expenditure
     * @param {Object} file - Uploaded file object from multer
     * @param {string} expenditureId - Expenditure ID
     * @param {string} documentType - Type of document
     * @param {string} userId - ID of the user uploading
     * @param {string} description - Optional description
     * @returns {Promise<Object>} Created attachment
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
     * @param {Object} file - Uploaded file object from multer
     * @param {string} retirementId - Retirement ID
     * @param {string} documentType - Type of document
     * @param {string} userId - ID of the user uploading
     * @param {string} description - Optional description
     * @returns {Promise<Object>} Created retirement attachment
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
     * @param {string} expenditureId - Expenditure ID
     * @returns {Promise<Array>} List of attachments
     */
    static async getAttachmentsByExpenditure(expenditureId) {
        const attachments = await db.Attachment.findAll({
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

        return attachments;
    }

    /**
     * Get attachments for a retirement
     * @param {string} retirementId - Retirement ID
     * @returns {Promise<Array>} List of attachments
     */
    static async getAttachmentsByRetirement(retirementId) {
        const attachments = await db.RetirementAttachment.findAll({
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

        return attachments;
    }

    /**
     * Get a single attachment by ID
     * @param {string} attachmentId - Attachment ID
     * @returns {Promise<Object>} Attachment
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
     * @param {string} attachmentId - Attachment ID
     * @returns {Promise<Object>} Retirement attachment
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
     * @param {string} attachmentId - Attachment ID
     * @param {string} userId - ID of the user deleting
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteAttachment(attachmentId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const attachment = await db.Attachment.findByPk(attachmentId, { transaction });

            if (!attachment) {
                throw new AppError('Attachment not found', 404);
            }

            // Only allow deletion by uploader or admin
            if (attachment.uploadedBy !== userId) {
                const user = await db.User.findByPk(userId);
                if (!user || !['admin', 'super_admin'].includes(user.role)) {
                    throw new AppError('You do not have permission to delete this attachment', 403);
                }
            }

            // Delete file from filesystem
            try {
                await fs.unlink(attachment.filePath);
            } catch (fileError) {
                console.error('Failed to delete file from filesystem:', fileError);
                // Continue with database deletion even if file deletion fails
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
     * @param {string} attachmentId - Attachment ID
     * @param {string} userId - ID of the user deleting
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteRetirementAttachment(attachmentId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const attachment = await db.RetirementAttachment.findByPk(attachmentId, { transaction });

            if (!attachment) {
                throw new AppError('Retirement attachment not found', 404);
            }

            // Only allow deletion by uploader or admin
            if (attachment.uploadedBy !== userId) {
                const user = await db.User.findByPk(userId);
                if (!user || !['admin', 'super_admin'].includes(user.role)) {
                    throw new AppError('You do not have permission to delete this attachment', 403);
                }
            }

            // Delete file from filesystem
            try {
                await fs.unlink(attachment.filePath);
            } catch (fileError) {
                console.error('Failed to delete file from filesystem:', fileError);
                // Continue with database deletion even if file deletion fails
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
     * @private
     * @param {Object} file - File object
     * @throws {AppError} If file is invalid
     */
    static validateFile(file) {
        if (!file) {
            throw new AppError('No file provided', 400);
        }

        // Allowed file types
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

        // Max file size: 10MB
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new AppError('File size exceeds 10MB limit', 400);
        }
    }

    /**
     * Get file download path
     * @param {string} attachmentId - Attachment ID
     * @returns {Promise<Object>} File path and metadata
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
     * @param {string} attachmentId - Attachment ID
     * @returns {Promise<Object>} File path and metadata
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

export default AttachmentService;
