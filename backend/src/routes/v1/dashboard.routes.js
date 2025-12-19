import express from 'express';
import { protect } from '../../middleware/v1/auth.middleware.js';
import { hasPermission } from '../../middleware/v1/authorize.middleware.js';
import * as dashboardController from '../../controllers/v1/dashboard.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Dashboard routes
router
    .route('/budget-overview')
    .get(hasPermission('dashboard:view'), dashboardController.getBudgetOverview);

router
    .route('/expenditure-summary')
    .get(hasPermission('dashboard:view'), dashboardController.getExpenditureSummary);

router
    .route('/budget-utilization')
    .get(hasPermission('dashboard:view'), dashboardController.getBudgetUtilization);

router
    .route('/retirement-status')
    .get(hasPermission('dashboard:view'), dashboardController.getRetirementStatus);

router
    .route('/early-warnings')
    .get(hasPermission('dashboard:view'), dashboardController.getEarlyWarnings);

router
    .route('/mda/:mdaId')
    .get(hasPermission('dashboard:view'), dashboardController.getMdaDashboard);

export default router;
