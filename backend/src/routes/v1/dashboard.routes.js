const express = require('express');
const { authMiddleware, requirePermission } = require('../../middleware/auth.js');
const dashboardController = require('../../controllers/v1/dashboard.controller.js');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Dashboard routes
router
    .route('/budget-overview')
    .get(requirePermission('dashboard:view'), dashboardController.getBudgetOverview);

router
    .route('/expenditure-summary')
    .get(requirePermission('dashboard:view'), dashboardController.getExpenditureSummary);

router
    .route('/budget-utilization')
    .get(requirePermission('dashboard:view'), dashboardController.getBudgetUtilization);

router
    .route('/retirement-status')
    .get(requirePermission('dashboard:view'), dashboardController.getRetirementStatus);

router
    .route('/early-warnings')
    .get(requirePermission('dashboard:view'), dashboardController.getEarlyWarnings);

router
    .route('/mda/:mdaId')
    .get(requirePermission('dashboard:view'), dashboardController.getMdaDashboard);

module.exports = router;
