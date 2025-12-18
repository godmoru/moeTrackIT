import BudgetService from '../../services/v1/budget.service.js';
import BudgetVersionService from '../../services/v1/budgetVersion.service.js';
import BudgetSnapshotService from '../../services/v1/budgetSnapshot.service.js';
import ApprovalWorkflowService from '../../services/v1/approvalWorkflow.service.js';
import NotificationService from '../../services/v1/notification.service.js';
import catchAsync from '../../utils/catchAsync.js';
import httpStatus from 'http-status';
import AppError from '../../utils/appError.js';
import logger from '../../config/v1/logger.js';

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management
 */

class BudgetController {
   /* /api/v1/budgets:
   *   post:
   *     tags: [Budgets]
   *     summary: Create a new budget
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Budget'
   *     responses:
   *       201:
   *         description: Budget created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   **/
  createBudget = catchAsync(async (req, res) => {
    const budget = await BudgetService.createBudget(req.body, req.user.id);
    res.status(httpStatus.CREATED).json({
      status: 'success',
      data: {
        budget,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   get:
   *     tags: [Budgets]
   *     summary: Get a budget by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *       - in: query
   *         name: includeLineItems
   *         schema:
   *           type: boolean
   *         description: Whether to include line items
   *     responses:
   *       200:
   *         description: Budget details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  getBudget = catchAsync(async (req, res) => {
    const budget = await BudgetService.getBudgetById(req.params.id, {
      includeLineItems: req.query.includeLineItems === 'true',
    });
    res.json({
      status: 'success',
      data: {
        budget,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets:
   *   get:
   *     tags: [Budgets]
   *     summary: Get all budgets with pagination
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: createdAt
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Sort order
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term
   *       - in: query
   *         name: mdaId
   *         schema:
   *           type: string
   *         description: Filter by MDA ID
   *       - in: query
   *         name: fiscalYear
   *         schema:
   *           type: integer
   *         description: Filter by fiscal year
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       200:
   *         description: List of budgets
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalItems:
   *                       type: integer
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Budget'
   *                     totalPages:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   */
  getAllBudgets = catchAsync(async (req, res) => {
    const result = await BudgetService.getAllBudgets(req.query);
    res.json({
      status: 'success',
      data: result,
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   patch:
   *     tags: [Budgets]
   *     summary: Update a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BudgetUpdate'
   *     responses:
   *       200:
   *         description: Budget updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  updateBudget = catchAsync(async (req, res) => {
    const budget = await BudgetService.updateBudget(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({
      status: 'success',
      data: {
        budget,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   delete:
   *     tags: [Budgets]
   *     summary: Delete a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     responses:
   *       204:
   *         description: Budget deleted successfully
   */
  deleteBudget = catchAsync(async (req, res) => {
    await BudgetService.deleteBudget(req.params.id);
    res.status(httpStatus.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/summary:
   *   get:
   *     tags: [Budgets]
   *     summary: Get budget summary
   *     parameters:
   *       - in: query
   *         name: mdaId
   *         schema:
   *           type: string
   *         description: Filter by MDA ID
   *       - in: query
   *         name: fiscalYear
   *         schema:
   *           type: integer
   *         description: Filter by fiscal year
   *     responses:
   *       200:
   *         description: Budget summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       mdaId:
   *                         type: string
   *                       fiscalYear:
   *                         type: integer
   *                       totalBudget:
   *                         type: number
   *                       totalSpent:
   *                         type: number
   *                       mda:
   *                         $ref: '#/components/schemas/MDA'
   */
  getBudgetSummary = catchAsync(async (req, res) => {
    const { mdaId, fiscalYear } = req.query;
    const summary = await BudgetService.getBudgetSummary(
      mdaId,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined
    );
    res.json({
      status: 'success',
      data: summary,
    });
  });
// }

  /**
   * @swagger
   * /api/v1/budgets/{id}/submit:
   *   post:
   *     tags: [Budgets]
   *     summary: Submit a budget for approval
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Budget submitted for approval
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  submitForApproval = catchAsync(async (req, res) => {
    const { budget, approval } = await ApprovalWorkflowService.submitForApproval(
      req.params.id,
      req.user.id,
      { comments: req.body.comments }
    );

    res.json({
      status: 'success',
      data: {
        budget,
        approval,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/approve:
   *   post:
   *     tags: [Budgets]
   *     summary: Approve a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Budget approved
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  approveBudget = catchAsync(async (req, res) => {
    const { budget, approval } = await ApprovalWorkflowService.approve(
      'budget',
      req.params.id,
      req.user.id,
      { comments: req.body.comments }
    );

    res.json({
      status: 'success',
      data: {
        budget,
        approval,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/reject:
   *   post:
   *     tags: [Budgets]
   *     summary: Reject a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rejectionReason
   *             properties:
   *               rejectionReason:
   *                 type: string
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Budget rejected
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  rejectBudget = catchAsync(async (req, res) => {
    const { budget, rejection } = await ApprovalWorkflowService.reject(
      'budget',
      req.params.id,
      req.user.id,
      {
        rejectionReason: req.body.rejectionReason,
        comments: req.body.comments,
      }
    );

    res.json({
      status: 'success',
      data: {
        budget,
        rejection,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/versions:
   *   post:
   *     tags: [Budgets]
   *     summary: Create a new version of a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - changes
   *             properties:
   *               changes:
   *                 type: object
   *                 description: Object containing the changes made in this version
   *               notes:
   *                 type: string
   *                 description: Optional notes about this version
   *     responses:
   *       201:
   *         description: Budget version created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BudgetVersion'
   */
  createBudgetVersion = catchAsync(async (req, res) => {
    const version = await BudgetVersionService.createBudgetVersion(
      req.params.id,
      {
        changes: req.body.changes,
        notes: req.body.notes,
      },
      req.user.id
    );

    res.status(httpStatus.CREATED).json({
      status: 'success',
      data: {
        version,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/versions:
   *   get:
   *     tags: [Budgets]
   *     summary: Get all versions of a budget
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     responses:
   *       200:
   *         description: List of budget versions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BudgetVersion'
   */
  getBudgetVersions = catchAsync(async (req, res) => {
    const versions = await BudgetVersionService.getBudgetVersions(req.params.id);
    res.json({
      status: 'success',
      results: versions.length,
      data: {
        versions,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/versions/{versionId}:
   *   get:
   *     tags: [Budgets]
   *     summary: Get a specific version of a budget
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *       - in: path
   *         name: versionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Version ID
   *     responses:
   *       200:
   *         description: Budget version details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BudgetVersion'
   */
  getBudgetVersion = catchAsync(async (req, res) => {
    const version = await BudgetVersionService.getBudgetVersion(req.params.versionId);
    res.json({
      status: 'success',
      data: {
        version,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/versions/{versionId}/restore:
   *   post:
   *     tags: [Budgets]
   *     summary: Restore a specific version of a budget
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *       - in: path
   *         name: versionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Version ID to restore
   *     responses:
   *       200:
   *         description: Budget restored to the specified version
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Budget'
   */
  restoreBudgetVersion = catchAsync(async (req, res) => {
    const budget = await BudgetVersionService.restoreBudgetVersion(
      req.params.versionId,
      req.user.id
    );

    res.json({
      status: 'success',
      data: {
        budget,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/snapshots:
   *   post:
   *     tags: [Budgets]
   *     summary: Create a snapshot of the current budget state
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               snapshotType:
   *                 type: string
   *                 enum: [monthly, quarterly, annual, ad-hoc]
   *                 default: ad-hoc
   *               notes:
   *                 type: string
   *               isBaseline:
   *                 type: boolean
   *                 description: Whether to set this as the baseline snapshot
   *     responses:
   *       201:
   *         description: Budget snapshot created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BudgetSnapshot'
   */
  createBudgetSnapshot = catchAsync(async (req, res) => {
    const snapshot = await BudgetSnapshotService.createBudgetSnapshot(
      req.params.id,
      {
        snapshotType: req.body.snapshotType || 'ad-hoc',
        notes: req.body.notes,
        isBaseline: req.body.isBaseline || false,
      },
      req.user.id
    );

    res.status(httpStatus.CREATED).json({
      status: 'success',
      data: {
        snapshot,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/snapshots:
   *   get:
   *     tags: [Budgets]
   *     summary: Get all snapshots for a budget
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *       - in: query
   *         name: snapshotType
   *         schema:
   *           type: string
   *           enum: [monthly, quarterly, annual, ad-hoc]
   *         description: Filter by snapshot type
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter snapshots after this date (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter snapshots before this date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of budget snapshots
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BudgetSnapshot'
   */
  getBudgetSnapshots = catchAsync(async (req, res) => {
    const snapshots = await BudgetSnapshotService.getBudgetSnapshots(
      req.params.id,
      {
        snapshotType: req.query.snapshotType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      }
    );

    res.json({
      status: 'success',
      results: snapshots.length,
      data: {
        snapshots,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/budgets/{id}/snapshots/compare:
   *   get:
   *     tags: [Budgets]
   *     summary: Compare two budget snapshots
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Budget ID
   *       - in: query
   *         name: snapshot1
   *         required: true
   *         schema:
   *           type: string
   *         description: First snapshot ID
   *       - in: query
   *         name: snapshot2
   *         required: true
   *         schema:
   *           type: string
   *         description: Second snapshot ID
   *     responses:
   *       200:
   *         description: Comparison result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 snapshot1:
   *                   $ref: '#/components/schemas/BudgetSnapshot'
   *                 snapshot2:
   *                   $ref: '#/components/schemas/BudgetSnapshot'
   *                 budgetChanges:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       field:
   *                         type: string
   *                       oldValue:
   *                         type: any
   *                       newValue:
   *                         type: any
   *                 lineItemComparison:
   *                   type: object
   *                   properties:
   *                     added:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/BudgetLineItem'
   *                     removed:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/BudgetLineItem'
   *                     modified:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           code:
   *                             type: string
   *                           description:
   *                             type: string
   *                           changes:
   *                             type: array
   *                             items:
   *                               type: object
   *                               properties:
   *                                 field:
   *                                   type: string
   *                                 oldValue:
   *                                   type: any
   *                                 newValue:
   *                                   type: any
   *                     unchanged:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/BudgetLineItem'
   */
  compareSnapshots = catchAsync(async (req, res) => {
    const { snapshot1, snapshot2 } = req.query;
    
    if (!snapshot1 || !snapshot2) {
      throw new AppError('Both snapshot1 and snapshot2 query parameters are required', 400);
    }

    const comparison = await BudgetSnapshotService.compareSnapshots(snapshot1, snapshot2);
    
    res.json({
      status: 'success',
      data: comparison,
    });
  });
}

export default new BudgetController();
