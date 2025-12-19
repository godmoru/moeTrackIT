import BudgetService from '../services/v1/budget.service.js';
import BudgetLineItemService from '../services/v1/budgetLineItem.service.js';
import ExpenditureService from '../services/v1/expenditure.service.js';
import ExpenditureRetirementService from '../services/v1/expenditureRetirement.service.js';
import EarlyWarningService from '../services/v1/earlyWarning.service.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Get budget overview dashboard data
 */
export const getBudgetOverview = catchAsync(async (req, res) => {
    const { mdaId, fiscalYear } = req.query;

    const budgets = await BudgetService.getAllBudgets({ mdaId, fiscalYear, limit: 100 });
    const summary = await BudgetService.getBudgetSummary(mdaId, fiscalYear);

    res.status(200).json({
        status: 'success',
        data: {
            budgets: budgets.items,
            summary,
        },
    });
});

/**
 * Get expenditure summary dashboard data
 */
export const getExpenditureSummary = catchAsync(async (req, res) => {
    const stats = await ExpenditureService.getExpenditureStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

/**
 * Get budget utilization data
 */
export const getBudgetUtilization = catchAsync(async (req, res) => {
    const { budgetId, mdaId } = req.query;

    let lineItems;
    if (budgetId) {
        lineItems = await BudgetLineItemService.getLineItemsByBudget(budgetId);
    } else if (mdaId) {
        const result = await BudgetLineItemService.getAllLineItems({ mdaId, limit: 100 });
        lineItems = result.items;
    } else {
        const result = await BudgetLineItemService.getAllLineItems({ limit: 100 });
        lineItems = result.items;
    }

    // Calculate utilization for each line item
    const utilizationData = await Promise.all(
        lineItems.map(async (lineItem) => {
            const stats = await BudgetLineItemService.getUtilizationStats(lineItem.id);
            return {
                lineItemId: lineItem.id,
                lineItemCode: lineItem.code,
                lineItemName: lineItem.name,
                category: lineItem.category,
                ...stats,
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: { utilization: utilizationData },
    });
});

/**
 * Get retirement status dashboard data
 */
export const getRetirementStatus = catchAsync(async (req, res) => {
    const stats = await ExpenditureRetirementService.getRetirementStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

/**
 * Get early warnings
 */
export const getEarlyWarnings = catchAsync(async (req, res) => {
    const { mdaId } = req.query;

    let warnings;
    if (mdaId) {
        warnings = await EarlyWarningService.getWarningsByMda(mdaId);
    } else {
        const summary = await EarlyWarningService.getWarningsSummary();
        warnings = summary.warnings;
    }

    res.status(200).json({
        status: 'success',
        data: { warnings },
    });
});

/**
 * Get MDA-specific dashboard data
 */
export const getMdaDashboard = catchAsync(async (req, res) => {
    const { mdaId } = req.params;
    const { fiscalYear } = req.query;

    // Get all dashboard data for the MDA
    const [budgets, expenditureStats, retirementStats, warnings] = await Promise.all([
        BudgetService.getAllBudgets({ mdaId, fiscalYear, limit: 10 }),
        ExpenditureService.getExpenditureStats({ mdaId, fiscalYear }),
        ExpenditureRetirementService.getRetirementStats({ mdaId }),
        EarlyWarningService.getWarningsByMda(mdaId),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            budgets: budgets.items,
            expenditureStats,
            retirementStats,
            warnings,
        },
    });
});
