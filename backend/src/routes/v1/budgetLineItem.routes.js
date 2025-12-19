const express = require('express');
const { check } = require('express-validator');
const { authMiddleware, requireRole, requirePermission } = require('../../middleware/auth.js');
const budgetLineItemController = require('../../controllers/v1/budgetLineItem.controller.js');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation rules
const createLineItemValidation = [
    check('code').notEmpty().withMessage('Code is required'),
    check('name').notEmpty().withMessage('Name is required'),
    check('budgetId').isInt().withMessage('Valid budget ID is required'),
    check('mdaId').isUUID().withMessage('Valid MDA ID is required'),
    check('category')
        .isIn(['personnel', 'overhead', 'recurrent', 'capital'])
        .withMessage('Valid category is required'),
    check('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    check('fiscalYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid fiscal year is required'),
    check('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Valid quarter is required'),
];

const updateLineItemValidation = [
    check('code').optional().notEmpty().withMessage('Code cannot be empty'),
    check('name').optional().notEmpty().withMessage('Name cannot be empty'),
    check('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

// Routes
router
    .route('/')
    .get(requirePermission('budget:read'), budgetLineItemController.getAllLineItems)
    .post(
        requirePermission('budget:write'),
        createLineItemValidation,
        budgetLineItemController.createLineItem
    );

router
    .route('/:id')
    .get(requirePermission('budget:read'), budgetLineItemController.getLineItem)
    .patch(
        requirePermission('budget:write'),
        updateLineItemValidation,
        budgetLineItemController.updateLineItem
    )
    .delete(requirePermission('budget:write'), budgetLineItemController.deleteLineItem);

router
    .route('/:id/utilization')
    .get(requirePermission('budget:read'), budgetLineItemController.getUtilizationStats);

router
    .route('/:id/recalculate-balance')
    .post(requirePermission('budget:write'), budgetLineItemController.recalculateBalance);

module.exports = router;
