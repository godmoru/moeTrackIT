import express from 'express';
import { protect } from '../../middleware/v1/auth.middleware.js';
import { hasPermission, ROLES } from '../../middleware/v1/authorize.middleware.js';
import approvalController from '../../controllers/v1/approval.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   - name: Approvals
 *     description: Budget and expenditure approval workflows
 */

// Budget approval routes
router.post(
  '/budgets/:id/submit',
  hasPermission('budget:submit'),
  approvalController.submitForApproval
);

router.post(
  '/budgets/:id/approve',
  hasPermission('budget:approve'),
  approvalController.approve
);

router.post(
  '/budgets/:id/reject',
  hasPermission('budget:approve'),
  approvalController.reject
);

// Expenditure approval routes
router.post(
  '/expenditures/:id/submit',
  hasPermission('expenditure:submit'),
  approvalController.submitForApproval
);

router.post(
  '/expenditures/:id/approve',
  hasPermission('expenditure:approve'),
  approvalController.approve
);

router.post(
  '/expenditures/:id/reject',
  hasPermission('expenditure:approve'),
  approvalController.reject
);

// Get approval history
router.get(
  '/history/:entityType/:entityId',
  hasPermission('approval:view'),
  approvalController.getApprovalHistory
);

export default router;
