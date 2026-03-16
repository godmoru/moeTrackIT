'use strict';

const express = require('express');
const { authMiddleware, requirePermission } = require('../../middleware/auth.js');
const { uploadSingle, handleUploadError } = require('../../middleware/v1/upload.middleware.js');
const attachmentController = require('../../controllers/v1/attachment.controller.js');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Expenditure attachment routes
router
    .route('/expenditures/:expenditureId')
    .get(requirePermission('expenditure:read'), attachmentController.getAttachmentsByExpenditure)
    .post(
        requirePermission('attachment:create'),
        uploadSingle,
        handleUploadError,
        attachmentController.uploadAttachment
    );

// Retirement attachment routes
router
    .route('/retirements/:retirementId')
    .get(requirePermission('retirement:read'), attachmentController.getAttachmentsByRetirement)
    .post(
        requirePermission('attachment:create'),
        uploadSingle,
        handleUploadError,
        attachmentController.uploadRetirementAttachment
    );

// Individual attachment routes
router
    .route('/:id')
    .get(requirePermission('attachment:read'), attachmentController.downloadAttachment)
    .delete(requirePermission('attachment:delete'), attachmentController.deleteAttachment);

// Individual retirement attachment routes
router
    .route('/retirements/attachments/:id')
    .get(requirePermission('attachment:read'), attachmentController.downloadRetirementAttachment)
    .delete(requirePermission('attachment:delete'), attachmentController.deleteRetirementAttachment);

module.exports = router;
