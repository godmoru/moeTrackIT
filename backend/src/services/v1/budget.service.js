const { Op } = require('sequelize');
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js'); // Pointing to src/models/index.js via relative path

class BudgetService {
  /**
   * Create a new budget
   * @param {Object} budgetData - Budget data
   * @param {string} userId - ID of the user creating the budget
   * @returns {Promise<Object>} Created budget
   */
  static async createBudget(budgetData, userId) {
    const transaction = await db.sequelize.transaction();

    try {
      // Check if budget with same code already exists for the MDA in the same fiscal year
      const existingBudget = await db.Budget.findOne({
        where: {
          mdaId: budgetData.mdaId,
          code: budgetData.code,
          fiscalYear: budgetData.fiscalYear,
        },
        transaction,
      });

      if (existingBudget) {
        throw new AppError('A budget with this code already exists for this MDA in the specified fiscal year', 400);
      }

      // Create the budget
      const budget = await db.Budget.create(
        {
          ...budgetData,
          createdBy: userId,
        },
        { transaction }
      );

      await transaction.commit();
      return budget;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get budget by ID
   * @param {string} budgetId - Budget ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Budget with related data
   */
  static async getBudgetById(budgetId, options = {}) {
    const { includeLineItems = false } = options;

    const include = [
      {
        model: db.Mda,
        as: 'mda',
        attributes: ['id', 'name', 'code', 'email', 'phoneNumber'],
      },
    ];

    if (includeLineItems) {
      include.push({
        model: db.BudgetLineItem,
        as: 'lineItems',
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
      });
    }

    const budget = await db.Budget.findByPk(budgetId, {
      include,
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    return budget;
  }

  /**
   * Get all budgets with pagination and filtering
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} Paginated budgets
   */
  static async getAllBudgets(query = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      mdaId,
      fiscalYear,
      isActive,
    } = query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (mdaId) where.mdaId = mdaId;
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: budgets } = await db.Budget.findAndCountAll({
      where,
      include: [
        {
          model: db.Mda,
          as: 'mda',
          attributes: ['id', 'name', 'code'],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true,
    });

    return {
      totalItems: count,
      items: budgets,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
    };
  }

  /**
   * Update a budget
   * @param {string} budgetId - Budget ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - ID of the user updating the budget
   * @returns {Promise<Object>} Updated budget
   */
  static async updateBudget(budgetId, updateData, userId) {
    const transaction = await db.sequelize.transaction();

    try {
      const budget = await db.Budget.findByPk(budgetId, { transaction });

      if (!budget) {
        throw new AppError('Budget not found', 404);
      }

      // Prevent updating certain fields
      const { mdaId, fiscalYear, code, ...safeUpdateData } = updateData;

      // If code is being updated, check for duplicates
      if (code && code !== budget.code) {
        const existingBudget = await db.Budget.findOne({
          where: {
            mdaId: budget.mdaId,
            code,
            fiscalYear: budget.fiscalYear,
            id: { [Op.ne]: budgetId },
          },
          transaction,
        });

        if (existingBudget) {
          throw new AppError('A budget with this code already exists for this MDA in the specified fiscal year', 400);
        }
      }

      await budget.update(
        {
          ...safeUpdateData,
          updatedBy: userId,
        },
        { transaction }
      );

      await transaction.commit();
      return budget;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a budget
   * @param {string} budgetId - Budget ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async deleteBudget(budgetId) {
    const transaction = await db.sequelize.transaction();

    try {
      const budget = await db.Budget.findByPk(budgetId, { transaction });

      if (!budget) {
        throw new AppError('Budget not found', 404);
      }

      // Check if budget has any expenditures
      const expenditureCount = await db.Expenditure.count({
        where: { budgetId },
        transaction,
      });

      if (expenditureCount > 0) {
        throw new AppError('Cannot delete budget with existing expenditures', 400);
      }

      // Delete related line items
      await db.BudgetLineItem.destroy({
        where: { budgetId },
        transaction,
      });

      // Delete the budget
      await budget.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get budget summary
   * @param {string} mdaId - MDA ID (optional)
   * @param {number} fiscalYear - Fiscal year (optional)
   * @returns {Promise<Object>} Budget summary
   */
  static async getBudgetSummary(mdaId, fiscalYear) {
    const where = {};

    if (mdaId) where.mdaId = mdaId;
    if (fiscalYear) where.fiscalYear = fiscalYear;

    const budgets = await db.Budget.findAll({
      where,
      attributes: [
        'mdaId',
        'fiscalYear',
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalBudget'],
        [db.sequelize.fn('SUM', db.sequelize.col('amountSpent')), 'totalSpent'],
      ],
      group: ['mdaId', 'fiscalYear'],
      include: [
        {
          model: db.Mda,
          as: 'mda',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    return budgets;
  }
}

module.exports = BudgetService;
