const BudgetService = require('../../services/v1/budget.service.js');
const BudgetLineItemService = require('../../services/v1/budgetLineItem.service.js');
const ExpenditureService = require('../../services/v1/expenditure.service.js');
const ExpenditureRetirementService = require('../../services/v1/expenditureRetirement.service.js');
const EarlyWarningService = require('../../services/v1/earlyWarning.service.js');
const catchAsync = require('../../utils/catchAsync.js');

/**
 * Get budget overview dashboard data
 */
exports.getBudgetOverview = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO - they don't see MDA budgets
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(200).json({
            status: 'success',
            data: {
                budgets: [],
                summary: [],
            },
        });
    }

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
exports.getExpenditureSummary = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    totalAmount: 0,
                    totalCount: 0,
                    pendingAmount: 0,
                    pendingCount: 0,
                    approvedAmount: 0,
                    approvedCount: 0,
                    rejectedAmount: 0,
                    rejectedCount: 0
                }
            },
        });
    }

    const stats = await ExpenditureService.getExpenditureStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

/**
 * Get budget utilization data
 */
exports.getBudgetUtilization = catchAsync(async (req, res) => {
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
exports.getRetirementStatus = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(200).json({
            status: 'success',
            data: { stats: { totalRetired: 0, count: 0 } },
        });
    }

    const stats = await ExpenditureRetirementService.getRetirementStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

/**
 * Get early warnings
 */
exports.getEarlyWarnings = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(200).json({
            status: 'success',
            data: { warnings: [] },
        });
    }

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
exports.getMdaDashboard = catchAsync(async (req, res) => {
    const { mdaId } = req.params;
    const { fiscalYear } = req.query;
    const userRole = req.user.role;

    // Expenditures should be hidden for these roles
    const hideExpenditures = userRole === 'principal' || userRole === 'area_education_officer';

    // Get all dashboard data for the MDA
    const [budgets, expenditureStats, retirementStats, warnings] = await Promise.all([
        BudgetService.getAllBudgets({ mdaId, fiscalYear, limit: 10 }),
        hideExpenditures ? Promise.resolve({ totalAmount: 0, totalCount: 0 }) : ExpenditureService.getExpenditureStats({ mdaId, fiscalYear }),
        hideExpenditures ? Promise.resolve({ totalRetired: 0, count: 0 }) : ExpenditureRetirementService.getRetirementStats({ mdaId }),
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
