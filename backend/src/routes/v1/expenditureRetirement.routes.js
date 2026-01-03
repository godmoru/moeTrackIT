const express = require('express');
const { check } = require('express-validator');
const { authMiddleware, requireRole, requirePermission } = require('../../middleware/auth.js');
const retirementController = require('../../controllers/v1/expenditureRetirement.controller.js');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

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
    .get(requirePermission('retirement:read'), retirementController.getAllRetirements)
    .post(
        requirePermission('retirement:create'),
        createRetirementValidation,
        retirementController.createRetirement
    );

router
    .route('/stats')
    .get(requirePermission('retirement:read'), retirementController.getRetirementStats);

router
    .route('/:id')
    .get(requirePermission('retirement:read'), retirementController.getRetirement)
    .patch(
        requirePermission('retirement:create'),
        updateRetirementValidation,
        retirementController.updateRetirement
    );

router
    .route('/:id/submit')
    .post(requirePermission('retirement:create'), retirementController.submitRetirement);

router
    .route('/:id/review')
    .post(
        requirePermission('retirement:review'),
        reviewRetirementValidation,
        retirementController.reviewRetirement
    );

router
    .route('/:id/approve')
    .post(requirePermission('retirement:approve'), retirementController.approveRetirement);

router
    .route('/:id/reject')
    .post(
        requirePermission('retirement:approve'),
        rejectRetirementValidation,
        retirementController.rejectRetirement
    );

module.exports = router;
