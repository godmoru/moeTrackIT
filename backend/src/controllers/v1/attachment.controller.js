'use strict';

const AttachmentService = require('../../services/v1/attachment.service.js');
const catchAsync = require('../../utils/catchAsync.js');

/**
 * Upload an attachment for an expenditure
 */
const uploadAttachment = catchAsync(async (req, res) => {
    const { documentType, description } = req.body;
    const attachment = await AttachmentService.uploadAttachment(
        req.file,
        req.params.expenditureId,
        documentType,
        req.user.id,
        description
    );

    res.status(201).json({
        status: 'success',
        data: { attachment },
        message: 'Attachment uploaded successfully',
    });
});

/**
 * Upload an attachment for a retirement
 */
const uploadRetirementAttachment = catchAsync(async (req, res) => {
    const { documentType, description } = req.body;
    const attachment = await AttachmentService.uploadRetirementAttachment(
        req.file,
        req.params.retirementId,
        documentType,
        req.user.id,
        description
    );

    res.status(201).json({
        status: 'success',
        data: { attachment },
        message: 'Retirement attachment uploaded successfully',
    });
});

/**
 * Get attachments for an expenditure
 */
const getAttachmentsByExpenditure = catchAsync(async (req, res) => {
    const attachments = await AttachmentService.getAttachmentsByExpenditure(
        req.params.expenditureId
    );

    res.status(200).json({
        status: 'success',
        data: { attachments },
    });
});

/**
 * Get attachments for a retirement
 */
const getAttachmentsByRetirement = catchAsync(async (req, res) => {
    const attachments = await AttachmentService.getAttachmentsByRetirement(
        req.params.retirementId
    );

    res.status(200).json({
        status: 'success',
        data: { attachments },
    });
});

/**
 * Download an attachment
 */
const downloadAttachment = catchAsync(async (req, res) => {
    const { filePath, fileName, fileType } = await AttachmentService.getFileDownloadPath(
        req.params.id
    );

    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
});

/**
 * Download a retirement attachment
 */
const downloadRetirementAttachment = catchAsync(async (req, res) => {
    const { filePath, fileName, fileType } = await AttachmentService.getRetirementFileDownloadPath(
        req.params.id
    );

    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
});

/**
 * Delete an attachment
 */
const deleteAttachment = catchAsync(async (req, res) => {
    await AttachmentService.deleteAttachment(req.params.id, req.user.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

/**
 * Delete a retirement attachment
 */
const deleteRetirementAttachment = catchAsync(async (req, res) => {
    await AttachmentService.deleteRetirementAttachment(req.params.id, req.user.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

module.exports = {
    uploadAttachment,
    uploadRetirementAttachment,
    getAttachmentsByExpenditure,
    getAttachmentsByRetirement,
    downloadAttachment,
    downloadRetirementAttachment,
    deleteAttachment,
    deleteRetirementAttachment,
};
