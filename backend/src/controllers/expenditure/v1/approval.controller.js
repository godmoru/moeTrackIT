import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/appError.js';
import ApprovalWorkflowService from '../../services/v1/approvalWorkflow.service.js';
import BudgetService from '../../services/v1/budget.service.js';
import { check, validationResult } from 'express-validator';

/**
 * @swagger
 * tags:
 *   name: Approvals
 *   description: API endpoints for managing approval workflows
 */

/**
 * @swagger
 * /api/v1/budgets/{id}/submit:
 *   post:
 *     summary: Submit a budget for approval
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID to submit for approval
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Optional comments for the submission
 *     responses:
 *       200:
 *         description: Budget submitted for approval successfully
 *       400:
 *         description: Invalid input or workflow error
 *       404:
 *         description: Budget not found
 */
const submitForApproval = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;
  const userId = req.user.id;

  // Verify budget exists and user has access
  await BudgetService.getBudgetById(id, userId);

  const result = await ApprovalWorkflowService.submitForApproval(
    id,
    userId,
    { comments }
  );

  res.status(200).json({
    status: 'success',
    message: 'Budget submitted for approval',
    data: {
      approval: result,
    },
  });
});

/**
 * @swagger
 * /api/v1/approve/budgets/{id}:
 *   post:
 *     summary: Approve a budget or expenditure
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget or Expenditure ID to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Optional approval comments
 *     responses:
 *       200:
 *         description: Approval successful
 *       400:
 *         description: Invalid input or workflow error
 *       404:
 *         description: Item not found
 */
const approve = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;
  const userId = req.user.id;
  const entityType = 'budget'; // or determine from request path/params

  const result = await ApprovalWorkflowService.approve(
    entityType,
    id,
    userId,
    { comments }
  );

  res.status(200).json({
    status: 'success',
    message: 'Approval processed successfully',
    data: {
      approval: result,
    },
  });
});

/**
 * @swagger
 * /api/v1/reject/budgets/{id}:
 *   post:
 *     summary: Reject a budget or expenditure
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget or Expenditure ID to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *               comments:
 *                 type: string
 *                 description: Additional comments
 *     responses:
 *       200:
 *         description: Rejection successful
 *       400:
 *         description: Invalid input or workflow error
 *       404:
 *         description: Item not found
 */
const reject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason, comments } = req.body;
  const userId = req.user.id;
  const entityType = 'budget'; // or determine from request path/params

  if (!reason) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const result = await ApprovalWorkflowService.reject(
    entityType,
    id,
    userId,
    { reason, comments }
  );

  res.status(200).json({
    status: 'success',
    message: 'Rejection processed successfully',
    data: {
      approval: result,
    },
  });
});

/**
 * @swagger
 * /api/v1/approval-history/{entityType}/{entityId}:
 *   get:
 *     summary: Get approval history for an entity
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [budget, expenditure]
 *         description: Type of entity to get history for
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the entity
 *     responses:
 *       200:
 *         description: Approval history retrieved successfully
 *       404:
 *         description: Entity not found
 */
const getApprovalHistory = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const userId = req.user.id;

  // Verify user has access to the entity
  if (entityType === 'budget') {
    await BudgetService.getBudgetById(entityId, userId);
  }
  // Add verification for other entity types as needed

  const history = await ApprovalWorkflowService.getApprovalHistory(
    entityType,
    entityId
  );

  res.status(200).json({
    status: 'success',
    results: history.length,
    data: {
      history,
    },
  });
});

// Validation rules
const validateApproval = [
  check('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments cannot exceed 1000 characters'),
];

const validateRejection = [
  check('reason')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Reason is required and cannot exceed 255 characters'),
  check('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments cannot exceed 1000 characters'),
];

export default {
  submitForApproval,
  approve: [...validateApproval, approve],
  reject: [...validateRejection, reject],
  getApprovalHistory,
};
