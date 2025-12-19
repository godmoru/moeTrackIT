import express from 'express';
import { check } from 'express-validator';
import { protect } from '../../middleware/v1/auth.middleware.js';
import { hasPermission } from '../../middleware/v1/authorize.middleware.js';
import validate from '../../middleware/v1/validate.js';
import * as retirementController from '../../controllers/v1/expenditureRetirement.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const createRetirementValidation = [
    check('expenditureId').isUUID().withMessage('Valid expenditure ID is required'),
    check('amountRetired').isFloat({ min: 0 }).withMessage('Amount retired must be a positive number'),
    check('purpose').notEmpty().withMessage('Purpose is required'),
];

const updateRetirementValidation = [
    check('amountRetired').optional().isFloat({ min: 0 }).withMessage('Amount retired must be a positive number'),
    check('purpose').optional().notEmpty().withMessage('Purpose cannot be empty'),
];

const reviewRetirementValidation = [
    check('status').isIn(['under_review', 'rejected']).withMessage('Valid status is required'),
    check('remarks').optional().notEmpty().withMessage('Remarks cannot be empty'),
];

const rejectRetirementValidation = [
    check('reason').notEmpty().withMessage('Rejection reason is required'),
];

// Routes
router
    .route('/')
    .get(hasPermission('retirement:read'), retirementController.getAllRetirements)
    .post(
        hasPermission('retirement:create'),
        createRetirementValidation,
        validate,
        retirementController.createRetirement
    );

router
    .route('/stats')
    .get(hasPermission('retirement:read'), retirementController.getRetirementStats);

router
    .route('/:id')
    .get(hasPermission('retirement:read'), retirementController.getRetirement)
    .patch(
        hasPermission('retirement:create'),
        updateRetirementValidation,
        validate,
        retirementController.updateRetirement
    );

router
    .route('/:id/submit')
    .post(hasPermission('retirement:create'), retirementController.submitRetirement);

router
    .route('/:id/review')
    .post(
        hasPermission('retirement:review'),
        reviewRetirementValidation,
        validate,
        retirementController.reviewRetirement
    );

router
    .route('/:id/approve')
    .post(hasPermission('retirement:approve'), retirementController.approveRetirement);

router
    .route('/:id/reject')
    .post(
        hasPermission('retirement:approve'),
        rejectRetirementValidation,
        validate,
        retirementController.rejectRetirement
    );

export default router;
