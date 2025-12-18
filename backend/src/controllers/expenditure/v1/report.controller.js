const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const ReportingService = require('../../services/v1/reporting.service');
const { check, query, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API endpoints for budget and expenditure reports
 */

/**
 * @swagger
 * /api/v1/reports/budget-summary:
 *   get:
 *     summary: Get budget summary by MDA
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fiscalYear
 *         schema:
 *           type: integer
 *         description: Fiscal year to filter by
 *       - in: query
 *         name: mdaId
 *         schema:
 *           type: string
 *         description: Filter by specific MDA ID
 *     responses:
 *       200:
 *         description: Budget summary retrieved successfully
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
 *                     summary:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BudgetSummary'
 */
const getBudgetSummary = catchAsync(async (req, res, next) => {
  const { fiscalYear, mdaId } = req.query;
  const options = {};
  
  if (fiscalYear) options.fiscalYear = parseInt(fiscalYear, 10);
  if (mdaId) options.mdaId = mdaId;

  const summary = await ReportingService.getBudgetSummaryByMda(options);
  
  res.status(200).json({
    status: 'success',
    data: {
      summary,
    },
  });
});

/**
 * @swagger
 * /api/v1/reports/expenditure-by-category:
 *   get:
 *     summary: Get expenditure breakdown by category
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by specific category ID
 *     responses:
 *       200:
 *         description: Expenditure by category retrieved successfully
 */
const getExpenditureByCategory = catchAsync(async (req, res, next) => {
  const { startDate, endDate, categoryId } = req.query;
  const options = {
    startDate,
    endDate,
    categoryId
  };

  const data = await ReportingService.getExpenditureByCategory(options);
  
  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * @swagger
 * /api/v1/reports/budget-vs-actual/{budgetId}:
 *   get:
 *     summary: Get budget vs actual expenditure comparison
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the budget
 *     responses:
 *       200:
 *         description: Budget vs actual data retrieved successfully
 */
const getBudgetVsActual = catchAsync(async (req, res, next) => {
  const { budgetId } = req.params;
  
  const data = await ReportingService.getBudgetVsActual(budgetId);
  
  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * @swagger
 * /api/v1/reports/expenditure-trends:
 *   get:
 *     summary: Get expenditure trends over time
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, quarterly, yearly]
 *           default: monthly
 *         description: Time period for trend analysis
 *       - in: query
 *         name: mdaId
 *         schema:
 *           type: string
 *         description: Filter by MDA ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Expenditure trends retrieved successfully
 */
const getExpenditureTrends = catchAsync(async (req, res, next) => {
  const { period = 'monthly', mdaId, categoryId } = req.query;
  const options = { period, mdaId, categoryId };
  
  const trends = await ReportingService.getExpenditureTrends(options);
  
  res.status(200).json({
    status: 'success',
    data: {
      trends,
    },
  });
});

/**
 * @swagger
 * /api/v1/reports/budget-utilization:
 *   get:
 *     summary: Get budget utilization by department
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fiscalYear
 *         schema:
 *           type: integer
 *         description: Fiscal year to filter by
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by specific department ID
 *     responses:
 *       200:
 *         description: Budget utilization data retrieved successfully
 */
const getBudgetUtilization = catchAsync(async (req, res, next) => {
  const { fiscalYear, departmentId } = req.query;
  const options = {};
  
  if (fiscalYear) options.fiscalYear = parseInt(fiscalYear, 10);
  if (departmentId) options.departmentId = departmentId;

  const data = await ReportingService.getBudgetUtilizationByDepartment(options);
  
  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * @swagger
 * /api/v1/reports/top-expenditures:
 *   get:
 *     summary: Get top expenditures
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top expenditures to return
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Top expenditures retrieved successfully
 */
const getTopExpenditures = catchAsync(async (req, res, next) => {
  const { limit = 10, startDate, endDate } = req.query;
  const options = {
    limit: parseInt(limit, 10),
    startDate,
    endDate
  };

  const expenditures = await ReportingService.getTopExpenditures(options);
  
  res.status(200).json({
    status: 'success',
    results: expenditures.length,
    data: {
      expenditures,
    },
  });
});

// Validation rules for query parameters
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date in YYYY-MM-DD format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

module.exports = {
  getBudgetSummary,
  getExpenditureByCategory: [...validateDateRange, getExpenditureByCategory],
  getBudgetVsActual,
  getExpenditureTrends: [
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
      .withMessage('Invalid period. Must be one of: daily, weekly, monthly, quarterly, yearly'),
    getExpenditureTrends
  ],
  getBudgetUtilization,
  getTopExpenditures: [...validateDateRange, getTopExpenditures],
};
