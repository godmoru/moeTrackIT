const { Op } = require('sequelize');
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');

class BudgetLineItemService {
    /**
     * Create a new budget line item
     * @param {Object} lineItemData - Line item data
     * @param {string} userId - ID of the user creating the line item
     * @returns {Promise<Object>} Created line item
     */
    static async createLineItem(lineItemData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            // Check if budget exists
            const budget = await db.Budget.findByPk(lineItemData.budgetId, { transaction });
            if (!budget) {
                throw new AppError('Budget not found', 404);
            }

            // Check if line item code already exists
            const existingLineItem = await db.BudgetLineItem.findOne({
                where: { code: lineItemData.code },
                transaction,
            });

            if (existingLineItem) {
                throw new AppError('A budget line item with this code already exists', 400);
            }

            // Set initial balance to amount
            const lineItem = await db.BudgetLineItem.create(
                {
                    ...lineItemData,
                    balance: lineItemData.amount,
                },
                { transaction }
            );

            await transaction.commit();
            return lineItem;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get line item by ID
     * @param {number} lineItemId - Line item ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Line item with related data
     */
    static async getLineItemById(lineItemId, options = {}) {
        const { includeExpenditures = false } = options;

        const include = [
            {
                model: db.Budget,
                as: 'budget',
                attributes: ['id', 'title', 'fiscalYear'],
            },
            {
                model: db.Mda,
                as: 'mda',
                attributes: ['id', 'name', 'code'],
            },
        ];

        if (includeExpenditures) {
            include.push({
                model: db.Expenditure,
                as: 'expenditures',
                attributes: { exclude: ['createdAt', 'updatedAt'] },
            });
        }

        const lineItem = await db.BudgetLineItem.findByPk(lineItemId, {
            include,
        });

        if (!lineItem) {
            throw new AppError('Budget line item not found', 404);
        }

        return lineItem;
    }

    /**
     * Get all line items with pagination and filtering
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Paginated line items
     */
    static async getAllLineItems(query = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            budgetId,
            mdaId,
            fiscalYear,
            category,
            quarter,
        } = query;

        const offset = (page - 1) * limit;
        const where = {};

        // Apply filters
        if (search) {
            where[Op.or] = [
                { code: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (budgetId) where.budgetId = budgetId;
        if (mdaId) where.mdaId = mdaId;
        if (fiscalYear) where.fiscalYear = fiscalYear;
        if (category) where.category = category;
        if (quarter) where.quarter = quarter;

        const { count, rows: lineItems } = await db.BudgetLineItem.findAndCountAll({
            where,
            include: [
                {
                    model: db.Budget,
                    as: 'budget',
                    attributes: ['id', 'title', 'fiscalYear'],
                },
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
            items: lineItems,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
        };
    }

    /**
     * Get line items by budget ID
     * @param {number} budgetId - Budget ID
     * @returns {Promise<Array>} Line items
     */
    static async getLineItemsByBudget(budgetId) {
        const lineItems = await db.BudgetLineItem.findAll({
            where: { budgetId },
            include: [
                {
                    model: db.Mda,
                    as: 'mda',
                    attributes: ['id', 'name', 'code'],
                },
            ],
            order: [['code', 'ASC']],
        });

        return lineItems;
    }

    /**
     * Update a line item
     * @param {number} lineItemId - Line item ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - ID of the user updating the line item
     * @returns {Promise<Object>} Updated line item
     */
    static async updateLineItem(lineItemId, updateData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const lineItem = await db.BudgetLineItem.findByPk(lineItemId, { transaction });

            if (!lineItem) {
                throw new AppError('Budget line item not found', 404);
            }

            // If code is being updated, check for duplicates
            if (updateData.code && updateData.code !== lineItem.code) {
                const existingLineItem = await db.BudgetLineItem.findOne({
                    where: {
                        code: updateData.code,
                        id: { [Op.ne]: lineItemId },
                    },
                    transaction,
                });

                if (existingLineItem) {
                    throw new AppError('A budget line item with this code already exists', 400);
                }
            }

            // If amount is being updated, recalculate balance
            if (updateData.amount && updateData.amount !== lineItem.amount) {
                const currentBalance = await lineItem.calculateBalance();
                const spent = parseFloat(lineItem.amount) - currentBalance;
                updateData.balance = parseFloat(updateData.amount) - spent;
            }

            await lineItem.update(updateData, { transaction });

            await transaction.commit();
            return lineItem;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete a line item
     * @param {number} lineItemId - Line item ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteLineItem(lineItemId) {
        const transaction = await db.sequelize.transaction();

        try {
            const lineItem = await db.BudgetLineItem.findByPk(lineItemId, { transaction });

            if (!lineItem) {
                throw new AppError('Budget line item not found', 404);
            }

            // Check if line item has any expenditures
            const expenditureCount = await db.Expenditure.count({
                where: { budgetLineItemId: lineItemId },
                transaction,
            });

            if (expenditureCount > 0) {
                throw new AppError('Cannot delete line item with existing expenditures', 400);
            }

            await lineItem.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Recalculate balance for a line item
     * @param {number} lineItemId - Line item ID
     * @returns {Promise<number>} Updated balance
     */
    static async recalculateBalance(lineItemId) {
        const transaction = await db.sequelize.transaction();

        try {
            const lineItem = await db.BudgetLineItem.findByPk(lineItemId, { transaction });

            if (!lineItem) {
                throw new AppError('Budget line item not found', 404);
            }

            const balance = await lineItem.calculateBalance();
            await lineItem.update({ balance }, { transaction });

            await transaction.commit();
            return balance;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get line item utilization statistics
     * @param {number} lineItemId - Line item ID
     * @returns {Promise<Object>} Utilization statistics
     */
    static async getUtilizationStats(lineItemId) {
        const lineItem = await db.BudgetLineItem.findByPk(lineItemId);

        if (!lineItem) {
            throw new AppError('Budget line item not found', 404);
        }

        const balance = await lineItem.calculateBalance();
        const utilizationPercentage = await lineItem.getUtilizationPercentage();
        const warningStatus = await lineItem.getWarningStatus();

        return {
            amount: parseFloat(lineItem.amount),
            balance,
            spent: parseFloat(lineItem.amount) - balance,
            utilizationPercentage,
            warningStatus,
        };
    }
}

module.exports = BudgetLineItemService;
