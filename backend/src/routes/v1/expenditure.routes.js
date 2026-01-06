const express = require('express');
const { check } = require('express-validator');
const { authMiddleware, requireRole, requirePermission } = require('../../middleware/auth.js');
const expenditureController = require('../../controllers/v1/expenditure.controller.js');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation rules
const createExpenditureValidation = [
    check('budgetLineItemId').isInt().withMessage('Valid budget line item ID is required'),
    check('mdaId').isUUID().withMessage('Valid MDA ID is required'),
    check('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    check('description').notEmpty().withMessage('Description is required'),
    check('date').optional().isISO8601().withMessage('Valid date is required'),
];

const updateExpenditureValidation = [
    check('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    check('description').optional().notEmpty().withMessage('Description cannot be empty'),
];

const rejectExpenditureValidation = [
    check('reason').notEmpty().withMessage('Rejection reason is required'),
];

// Routes
router
    .route('/')
    .get(requirePermission('expenditure:read'), expenditureController.getAllExpenditures)
    .post(
        requirePermission('expenditure:create'),
        createExpenditureValidation,
        expenditureController.createExpenditure
    );

router
    .route('/stats')
    .get(requirePermission('expenditure:read'), expenditureController.getExpenditureStats);

router
    .route('/:id')
    .get(requirePermission('expenditure:read'), expenditureController.getExpenditure)
    .patch(
        requirePermission('expenditure:update'),
        updateExpenditureValidation,
        expenditureController.updateExpenditure
    )
    .delete(requirePermission('expenditure:trash'), expenditureController.deleteExpenditure);

router
    .route('/:id/submit')
    .post(requirePermission('expenditure:update'), expenditureController.submitExpenditure);

router
    .route('/:id/approve')
    .post(requirePermission('expenditure:approve'), expenditureController.approveExpenditure);

router
    .route('/:id/reject')
    .post(
        requirePermission('expenditure:approve'),
        rejectExpenditureValidation,
        expenditureController.rejectExpenditure
    );

module.exports = router;
