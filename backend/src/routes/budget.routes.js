const express = require('express');
const auth = require('../../middleware/auth');
const { check } = require('express-validator');
const budgetController = require('../../controllers/v1/budget.controller');
const validate = require('../../middleware/validate');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       required:
 *         - title
 *         - code
 *         - mdaId
 *         - fiscalYear
 *         - amount
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the budget
 *         title:
 *           type: string
 *           description: The budget title
 *         code:
 *           type: string
 *           description: Unique code for the budget
 *         description:
 *           type: string
 *           description: Detailed description of the budget
 *         mdaId:
 *           type: string
 *           format: uuid
 *           description: ID of the MDA this budget belongs to
 *         fiscalYear:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *           description: Fiscal year of the budget (e.g., 2023)
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Total budget amount
 *         amountSpent:
 *           type: number
 *           readOnly: true
 *           description: Total amount spent from this budget (auto-calculated)
 *         balance:
 *           type: number
 *           readOnly: true
 *           description: Remaining balance (auto-calculated)
 *         startDate:
 *           type: string
 *           format: date
 *           description: Budget start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Budget end date
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the budget is currently active
 *         isDonorFunded:
 *           type: boolean
 *           default: false
 *           description: Whether the budget is funded by a donor
 *         donorName:
 *           type: string
 *           description: Name of the donor (if donor-funded)
 *         donorCode:
 *           type: string
 *           description: Donor code (if donor-funded)
 *         donorAgreementNumber:
 *           type: string
 *           description: Donor agreement number (if donor-funded)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 * 
 *     BudgetUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The budget title
 *         code:
 *           type: string
 *           description: Unique code for the budget
 *         description:
 *           type: string
 *           description: Detailed description of the budget
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Total budget amount
 *         startDate:
 *           type: string
 *           format: date
 *           description: Budget start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Budget end date
 *         isActive:
 *           type: boolean
 *           description: Whether the budget is currently active
 *         isDonorFunded:
 *           type: boolean
 *           description: Whether the budget is funded by a donor
 *         donorName:
 *           type: string
 *           description: Name of the donor (if donor-funded)
 *         donorCode:
 *           type: string
 *           description: Donor code (if donor-funded)
 *         donorAgreementNumber:
 *           type: string
 *           description: Donor agreement number (if donor-funded)
 */

// Validation rules
const createBudgetValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('code').notEmpty().withMessage('Code is required'),
  check('mdaId').isUUID().withMessage('Valid MDA ID is required'),
  check('fiscalYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid fiscal year is required'),
  check('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  check('startDate').isISO8601().withMessage('Valid start date is required'),
  check('endDate').isISO8601().withMessage('Valid end date is required'),
  check('endDate').custom((value, { req }) => {
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
  check('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  check('endDate').optional().custom((value, { req }) => {
    const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (startDate && new Date(value) <= startDate) {
      throw new Error('End date must be after start date');
    }
    return true;
  }),
];

// Routes
router
  .route('/')
  /**
   * @swagger
   * /api/v1/budgets:
   *   get:
   *     summary: Get all budgets with pagination
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/pageParam'
   *       - $ref: '#/components/parameters/limitParam'
   *       - $ref: '#/components/parameters/sortByParam'
   *       - $ref: '#/components/parameters/sortOrderParam'
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for title, code, or description
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
   *               $ref: '#/components/schemas/PaginatedResponse'
   */
  .get(budgetController.getAllBudgets)
  
  /**
   * @swagger
   * /api/v1/budgets:
   *   post:
   *     summary: Create a new budget
   *     tags: [Budgets]
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
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   */
  .post(createBudgetValidation, validate, budgetController.createBudget);

router
  .route('/summary')
  /**
   * @swagger
   * /api/v1/budgets/summary:
   *   get:
   *     summary: Get budget summary
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
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
  .get(budgetController.getBudgetSummary);

router
  .route('/:id')
  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   get:
   *     summary: Get a budget by ID
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
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
   *       404:
   *         description: Budget not found
   */
  .get(budgetController.getBudget)
  
  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   patch:
   *     summary: Update a budget
   *     tags: [Budgets]
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
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         description: Budget not found
   */
  .patch(updateBudgetValidation, validate, budgetController.updateBudget)
  
  /**
   * @swagger
   * /api/v1/budgets/{id}:
   *   delete:
   *     summary: Delete a budget
   *     tags: [Budgets]
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
   *       400:
   *         description: Cannot delete budget with expenditures
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         description: Budget not found
   */
  .delete(budgetController.deleteBudget);

module.exports = router;
