import express from 'express';
import { protect } from '../../middleware/v1/auth.middleware.js';
import { hasPermission } from '../../middleware/v1/authorize.middleware.js';
import { uploadSingle, handleUploadError } from '../../middleware/v1/upload.middleware.js';
import * as attachmentController from '../../controllers/v1/attachment.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Expenditure attachment routes
router
    .route('/expenditures/:expenditureId')
    .get(hasPermission('expenditure:read'), attachmentController.getAttachmentsByExpenditure)
    .post(
        hasPermission('expenditure:create'),
        uploadSingle,
        handleUploadError,
        attachmentController.uploadAttachment
    );

// Retirement attachment routes
router
    .route('/retirements/:retirementId')
    .get(hasPermission('retirement:read'), attachmentController.getAttachmentsByRetirement)
    .post(
        hasPermission('retirement:create'),
        uploadSingle,
        handleUploadError,
        attachmentController.uploadRetirementAttachment
    );

// Individual attachment routes
router
    .route('/:id')
    .get(hasPermission('expenditure:read'), attachmentController.downloadAttachment)
    .delete(hasPermission('expenditure:create'), attachmentController.deleteAttachment);

// Individual retirement attachment routes
router
    .route('/retirements/attachments/:id')
    .get(hasPermission('retirement:read'), attachmentController.downloadRetirementAttachment)
    .delete(hasPermission('retirement:create'), attachmentController.deleteRetirementAttachment);

export default router;
