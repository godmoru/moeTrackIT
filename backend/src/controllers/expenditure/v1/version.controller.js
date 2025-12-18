const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const BudgetVersionService = require('../../services/v1/budgetVersion.service');
const BudgetService = require('../../services/v1/budget.service');
const { check, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Budget Versions
 *   description: API endpoints for managing budget versions
 */

/**
 * @swagger
 * /api/v1/budgets/{id}/versions:
 *   post:
 *     summary: Create a new version of a budget
 *     tags: [Budget Versions]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the new version
 *               description:
 *                 type: string
 *                 description: Description of changes in this version
 *     responses:
 *       201:
 *         description: Version created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Budget not found
 */
const createVersion = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation error', 400, errors.array()));
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  // Verify budget exists and user has access
  await BudgetService.getBudgetById(id, userId);

  const version = await BudgetVersionService.createBudgetVersion(
    id,
    { name, description },
    userId
  );

  res.status(201).json({
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
 *     summary: Get all versions of a budget
 *     tags: [Budget Versions]
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
 *       200:
 *         description: List of budget versions
 *       404:
 *         description: Budget not found
 */
const getVersions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify budget exists and user has access
  await BudgetService.getBudgetById(id, userId);

  const versions = await BudgetVersionService.getBudgetVersions(id);

  res.status(200).json({
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
 *     summary: Get a specific version of a budget
 *     tags: [Budget Versions]
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
 *         description: Version ID
 *     responses:
 *       200:
 *         description: Version details
 *       404:
 *         description: Version not found
 */
const getVersion = catchAsync(async (req, res, next) => {
  const { versionId } = req.params;
  const userId = req.user.id;

  const version = await BudgetVersionService.getBudgetVersion(versionId);
  if (!version) {
    return next(new AppError('Version not found', 404));
  }

  // Verify user has access to the parent budget
  await BudgetService.getBudgetById(version.budgetId, userId);

  res.status(200).json({
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
 *     summary: Restore a specific version of a budget
 *     tags: [Budget Versions]
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
 *         description: Version restored successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Version not found
 */
const restoreVersion = catchAsync(async (req, res, next) => {
  const { id, versionId } = req.params;
  const userId = req.user.id;

  // Verify budget exists and user has access
  await BudgetService.getBudgetById(id, userId);

  // Restore the version
  const restoredBudget = await BudgetVersionService.restoreBudgetVersion(
    versionId,
    userId
  );

  res.status(200).json({
    status: 'success',
    data: {
      budget: restoredBudget,
    },
  });
});

// Validation rules
const validateVersion = [
  check('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  check('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

module.exports = {
  createVersion: [...validateVersion, createVersion],
  getVersions,
  getVersion,
  restoreVersion,
};
