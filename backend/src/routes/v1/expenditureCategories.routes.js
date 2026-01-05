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



// Routes
router
    .route('/')
    .get(
        // requirePermission('expenditure-categories:read'), 
        expenditureController.getAllExpenditureCategories)
    .post(
        requirePermission('expenditure-category:create'),
        createExpenditureValidation,
        expenditureController.createExpenditureCategory
    );


router
    .route('/:id')
    .get(
        requirePermission('expenditure-category:read'),
         expenditureController.getExpenditureCategoryById)
    .patch(
        // requirePermission('expenditure-category:create'),
        // updateExpenditureValidation,
        expenditureController.updateExpenditureCategory
    )
    .delete(requirePermission('expenditure-category:create'), expenditureController.deleteExpenditure);



module.exports = router;
