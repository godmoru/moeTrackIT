const { Op, literal, fn, col } = require('sequelize');
const AppError = require('../../utils/appError');
const db = require('../../models/v1/index.js');

class ReportingService {
  /**
   * Get budget summary by MDA
   * @param {Object} options - Query options
   * @param {string} options.fiscalYear - Filter by fiscal year
   * @param {string} options.mdaId - Filter by MDA ID
   * @returns {Promise<Array>} Budget summary by MDA
   */
  static async getBudgetSummaryByMda(options = {}) {
    const { fiscalYear, mdaId } = options;
    
    const where = {};
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (mdaId) where.mdaId = mdaId;
    
    const budgets = await db.Budget.findAll({
      where,
      include: [
        {
          model: db.Mda,
          as: 'mda',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: db.BudgetLineItem,
          as: 'lineItems',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'mdaId',
        [fn('sum', col('amount')), 'totalBudget'],
        [fn('sum', col('lineItems.amount')), 'totalLineItems'],
        [fn('count', col('lineItems.id')), 'lineItemCount'],
      ],
      group: ['mdaId', 'mda.id'],
      order: [[col('mda.name'), 'ASC']],
      raw: true,
      nest: true,
    });

    return budgets;
  }

  /**
   * Get expenditure summary by category
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.mdaId - Filter by MDA ID
   * @returns {Promise<Array>} Expenditure summary by category
   */
  static async getExpenditureByCategory(options = {}) {
    const { startDate, endDate, mdaId } = options;
    
    const where = { status: 'approved' };
    if (startDate) where.date = { [Op.gte]: new Date(startDate) };
    if (endDate) where.date = { ...where.date, [Op.lte]: new Date(endDate) };
    if (mdaId) where.mdaId = mdaId;
    
    const expenditures = await db.Expenditure.findAll({
      where,
      include: [
        {
          model: db.BudgetLineItem,
          as: 'lineItem',
          attributes: ['id', 'code', 'description', 'category'],
          include: [
            {
              model: db.Budget,
              as: 'budget',
              attributes: ['id', 'title', 'code'],
              include: [
                {
                  model: db.Mda,
                  as: 'mda',
                  attributes: ['id', 'name', 'code'],
                },
              ],
            },
          ],
        },
      ],
      attributes: [
        [col('lineItem.category'), 'category'],
        [fn('sum', col('amount')), 'totalAmount'],
        [fn('count', col('id')), 'transactionCount'],
      ],
      group: ['lineItem.category'],
      order: [[fn('sum', col('amount')), 'DESC']],
      raw: true,
      nest: true,
    });

    return expenditures;
  }

  /**
   * Get budget vs actual spending
   * @param {string} budgetId - Budget ID
   * @returns {Promise<Object>} Budget vs actual comparison
   */
  static async getBudgetVsActual(budgetId) {
    const [budget, expenditures] = await Promise.all([
      db.Budget.findByPk(budgetId, {
        include: [
          {
            model: db.BudgetLineItem,
            as: 'lineItems',
            attributes: ['id', 'code', 'description', 'category', 'amount'],
          },
          {
            model: db.Mda,
            as: 'mda',
            attributes: ['id', 'name', 'code'],
          },
        ],
      }),
      db.Expenditure.findAll({
        where: { budgetId, status: 'approved' },
        attributes: [
          'lineItemId',
          [fn('sum', col('amount')), 'totalSpent'],
        ],
        group: ['lineItemId'],
        raw: true,
      }),
    ]);

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    // Create a map of line item ID to total spent
    const spentByLineItem = expenditures.reduce((acc, item) => {
      acc[item.lineItemId] = parseFloat(item.totalSpent);
      return acc;
    }, {});

    // Calculate totals
    let totalBudget = 0;
    let totalSpent = 0;
    let totalRemaining = 0;
    let totalUtilization = 0;

    // Process line items
    const lineItems = budget.lineItems.map(item => {
      const spent = spentByLineItem[item.id] || 0;
      const remaining = item.amount - spent;
      const utilization = item.amount > 0 ? (spent / item.amount) * 100 : 0;

      totalBudget += item.amount;
      totalSpent += spent;
      totalRemaining += remaining;

      return {
        id: item.id,
        code: item.code,
        description: item.description,
        category: item.category,
        budgetAmount: item.amount,
        amountSpent: spent,
        amountRemaining: remaining,
        utilizationPercentage: parseFloat(utilization.toFixed(2)),
      };
    });

    // Calculate overall utilization
    totalUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      budget: {
        id: budget.id,
        code: budget.code,
        title: budget.title,
        fiscalYear: budget.fiscalYear,
        mda: budget.mda,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalBudget: parseFloat(totalBudget.toFixed(2)),
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalRemaining: parseFloat(totalRemaining.toFixed(2)),
        totalUtilizationPercentage: parseFloat(totalUtilization.toFixed(2)),
      },
      lineItems,
    };
  }

  /**
   * Get expenditure trends over time
   * @param {Object} options - Query options
   * @param {string} options.groupBy - Group by period ('day', 'week', 'month', 'quarter', 'year')
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.mdaId - Filter by MDA ID
   * @returns {Promise<Array>} Expenditure trends
   */
  static async getExpenditureTrends(options = {}) {
    const { groupBy = 'month', startDate, endDate, mdaId } = options;
    
    const where = { status: 'approved' };
    if (startDate) where.date = { [Op.gte]: new Date(startDate) };
    if (endDate) where.date = { ...where.date, [Op.lte]: new Date(endDate) };
    if (mdaId) where.mdaId = mdaId;

    // Determine the date truncation function based on groupBy
    let dateTrunc;
    switch (groupBy.toLowerCase()) {
      case 'day':
        dateTrunc = fn('date_trunc', 'day', col('date'));
        break;
      case 'week':
        dateTrunc = fn('date_trunc', 'week', col('date'));
        break;
      case 'quarter':
        dateTrunc = fn('date_trunc', 'quarter', col('date'));
        break;
      case 'year':
        dateTrunc = fn('date_trunc', 'year', col('date'));
        break;
      case 'month':
      default:
        dateTrunc = fn('date_trunc', 'month', col('date'));
        break;
    }

    const trends = await db.Expenditure.findAll({
      where,
      attributes: [
        [dateTrunc, 'period'],
        [fn('sum', col('amount')), 'totalAmount'],
        [fn('count', col('id')), 'transactionCount'],
      ],
      group: ['period'],
      order: [['period', 'ASC']],
      raw: true,
    });

    return trends;
  }

  /**
   * Get budget utilization by department
   * @param {Object} options - Query options
   * @param {string} options.fiscalYear - Filter by fiscal year
   * @returns {Promise<Array>} Budget utilization by department
   */
  static async getBudgetUtilizationByDepartment(options = {}) {
    const { fiscalYear } = options;
    
    const where = {};
    if (fiscalYear) where.fiscalYear = fiscalYear;
    
    const budgets = await db.Budget.findAll({
      where,
      include: [
        {
          model: db.Mda,
          as: 'mda',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: db.Expenditure,
          as: 'expenditures',
          where: { status: 'approved' },
          required: false,
          attributes: [],
        },
      ],
      attributes: [
        'mdaId',
        [col('mda.name'), 'mdaName'],
        [col('mda.code'), 'mdaCode'],
        [fn('sum', col('amount')), 'totalBudget'],
        [fn('sum', col('expenditures.amount')), 'totalSpent'],
        [
          literal(`CASE 
            WHEN SUM(amount) > 0 
            THEN (COALESCE(SUM("expenditures->expenditures".amount), 0) / SUM(amount)) * 100 
            ELSE 0 
          END`),
          'utilizationPercentage',
        ],
      ],
      group: ['mdaId', 'mda.id'],
      order: [[col('mda.name'), 'ASC']],
      raw: true,
    });

    return budgets.map(item => ({
      mdaId: item.mdaId,
      mdaName: item.mdaName,
      mdaCode: item.mdaCode,
      totalBudget: parseFloat(item.totalBudget || 0).toFixed(2),
      totalSpent: parseFloat(item.totalSpent || 0).toFixed(2),
      utilizationPercentage: parseFloat(item.utilizationPercentage || 0).toFixed(2),
    }));
  }

  /**
   * Get top expenditures
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.mdaId - Filter by MDA ID
   * @returns {Promise<Array>} Top expenditures
   */
  static async getTopExpenditures(options = {}) {
    const { limit = 10, startDate, endDate, mdaId } = options;
    
    const where = { status: 'approved' };
    if (startDate) where.date = { [Op.gte]: new Date(startDate) };
    if (endDate) where.date = { ...where.date, [Op.lte]: new Date(endDate) };
    if (mdaId) where.mdaId = mdaId;
    
    const expenditures = await db.Expenditure.findAll({
      where,
      include: [
        {
          model: db.BudgetLineItem,
          as: 'lineItem',
          attributes: ['id', 'code', 'description', 'category'],
          include: [
            {
              model: db.Budget,
              as: 'budget',
              attributes: ['id', 'title', 'code'],
              include: [
                {
                  model: db.Mda,
                  as: 'mda',
                  attributes: ['id', 'name', 'code'],
                },
              ],
            },
          ],
        },
        {
          model: db.User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['amount', 'DESC']],
      limit: parseInt(limit, 10),
    });

    return expenditures;
  }

  /**
   * Get budget execution rate
   * @param {Object} options - Query options
   * @param {string} options.fiscalYear - Fiscal year
   * @param {string} options.mdaId - Filter by MDA ID
   * @returns {Promise<Array>} Budget execution rate
   */
  static async getBudgetExecutionRate(options = {}) {
    const { fiscalYear, mdaId } = options;
    
    const where = {};
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (mdaId) where.mdaId = mdaId;
    
    const budgets = await db.Budget.findAll({
      where,
      include: [
        {
          model: db.Mda,
          as: 'mda',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: db.Expenditure,
          as: 'expenditures',
          where: { status: 'approved' },
          required: false,
          attributes: [],
        },
      ],
      attributes: [
        'id',
        'code',
        'title',
        'fiscalYear',
        'startDate',
        'endDate',
        [fn('sum', col('amount')), 'totalBudget'],
        [fn('sum', col('expenditures.amount')), 'totalSpent'],
        [
          literal(`CASE 
            WHEN SUM(amount) > 0 
            THEN (COALESCE(SUM("expenditures".amount), 0) / SUM(amount)) * 100 
            ELSE 0 
          END`),
          'executionRate',
        ],
      ],
      group: ['Budget.id', 'mda.id'],
      order: [[fn('sum', col('amount')), 'DESC']],
      raw: true,
      nest: true,
    });

    return budgets.map(item => ({
      id: item.id,
      code: item.code,
      title: item.title,
      fiscalYear: item.fiscalYear,
      startDate: item.startDate,
      endDate: item.endDate,
      mda: item.mda,
      totalBudget: parseFloat(item.totalBudget || 0).toFixed(2),
      totalSpent: parseFloat(item.totalSpent || 0).toFixed(2),
      executionRate: parseFloat(item.executionRate || 0).toFixed(2),
    }));
  }
}

module.exports = ReportingService;
