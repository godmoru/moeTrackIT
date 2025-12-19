const BudgetLineItemService = require('../../services/v1/budgetLineItem.service.js');
const catchAsync = require('../../utils/catchAsync.js');

/**
 * Create a new budget line item
 */
const createLineItem = catchAsync(async (req, res) => {
    const lineItem = await BudgetLineItemService.createLineItem(req.body, req.user.id);

    res.status(201).json({
        status: 'success',
        data: { lineItem },
    });
});

/**
 * Get all budget line items
 */
const getAllLineItems = catchAsync(async (req, res) => {
    const result = await BudgetLineItemService.getAllLineItems(req.query);

    res.status(200).json({
        status: 'success',
        ...result,
    });
});

/**
 * Get budget line items by budget ID
 */
const getLineItemsByBudget = catchAsync(async (req, res) => {
    const lineItems = await BudgetLineItemService.getLineItemsByBudget(req.params.budgetId);

    res.status(200).json({
        status: 'success',
        data: { lineItems },
    });
});

/**
 * Get a single budget line item
 */
const getLineItem = catchAsync(async (req, res) => {
    const lineItem = await BudgetLineItemService.getLineItemById(
        req.params.id,
        { includeExpenditures: req.query.includeExpenditures === 'true' }
    );

    res.status(200).json({
        status: 'success',
        data: { lineItem },
    });
});

/**
 * Update a budget line item
 */
const updateLineItem = catchAsync(async (req, res) => {
    const lineItem = await BudgetLineItemService.updateLineItem(
        req.params.id,
        req.body,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { lineItem },
    });
});

/**
 * Delete a budget line item
 */
const deleteLineItem = catchAsync(async (req, res) => {
    await BudgetLineItemService.deleteLineItem(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

/**
 * Get utilization statistics for a line item
 */
const getUtilizationStats = catchAsync(async (req, res) => {
    const stats = await BudgetLineItemService.getUtilizationStats(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

/**
 * Recalculate balance for a line item
 */
const recalculateBalance = catchAsync(async (req, res) => {
    const balance = await BudgetLineItemService.recalculateBalance(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { balance },
    });
});

module.exports = {
    createLineItem,
    getAllLineItems,
    getLineItemsByBudget,
    getLineItem,
    updateLineItem,
    deleteLineItem,
    getUtilizationStats,
    recalculateBalance,
};
