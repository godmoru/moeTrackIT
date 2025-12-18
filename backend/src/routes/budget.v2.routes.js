import express from 'express';
import { check } from 'express-validator';
import { protect, restrictTo } from '../../middleware/v1/auth.middleware.js';
import { hasPermission, ROLES } from '../../middleware/v1/authorize.middleware.js';
import validate from '../../middleware/v1/validate.js';

// Import controllers
import * as budgetController from '../../controllers/v1/budget.controller.js';
import * as versionController from '../../controllers/v1/version.controller.js';
import * as approvalController from '../../controllers/v1/approval.controller.js';
import * as reportController from '../../controllers/v1/report.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const createBudgetValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('code').notEmpty().withMessage('Code is required'),
  check('mdaId').isUUID().withMessage('Valid MDA ID is required'),
  check('fiscalYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid fiscal year is required'),
  check('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  check('startDate').isISO8601().withMessage('Valid start date is required'),
  check('endDate').isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

const updateBudgetValidation = [
  check('title').optional().notEmpty().withMessage('Title cannot be empty'),
  check('code').optional().notEmpty().withMessage('Code cannot be empty'),
  check('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  check('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  check('endDate').optional().isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      if (startDate && new Date(value) <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

// Base budget routes
router
  .route('/')
  .get(
    hasPermission('budget:read'),
    budgetController.getAllBudgets
  )
  .post(
    restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
    createBudgetValidation,
    validate,
    budgetController.createBudget
  );

// Budget summary and analytics
router.get(
  '/summary',
  hasPermission('report:view'),
  reportController.getBudgetSummary
);

// Budget approval workflow routes
router.post(
  '/:id/submit',
  restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
  approvalController.submitForApproval
);

router.post(
  '/:id/approve',
  restrictTo(ROLES.BUDGET_APPROVER.name, ROLES.SUPER_ADMIN.name),
  approvalController.approve
);

router.post(
  '/:id/reject',
  restrictTo(ROLES.BUDGET_APPROVER.name, ROLES.SUPER_ADMIN.name),
  approvalController.reject
);

// Budget versioning routes
router
  .route('/:id/versions')
  .get(
    hasPermission('budget:read'),
    versionController.getVersions
  )
  .post(
    restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
    versionController.createVersion
  );

router
  .route('/:id/versions/:versionId')
  .get(
    hasPermission('budget:read'),
    versionController.getVersion
  )
  .post(
    restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
    versionController.restoreVersion
  );

// Budget reports
router.get(
  '/:id/reports/expenditure-by-category',
  hasPermission('report:view'),
  reportController.getExpenditureByCategory
);

router.get(
  '/:id/reports/budget-vs-actual',
  hasPermission('report:view'),
  reportController.getBudgetVsActual
);

// Individual budget routes
router
  .route('/:id')
  .get(
    hasPermission('budget:read'),
    budgetController.getBudget
  )
  .patch(
    restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
    updateBudgetValidation,
    validate,
    budgetController.updateBudget
  )
  .delete(
    restrictTo(ROLES.BUDGET_MANAGER.name, ROLES.SUPER_ADMIN.name),
    budgetController.deleteBudget
  );

// Export routes
// Export the router
export default {router, protect, restrictTo};
