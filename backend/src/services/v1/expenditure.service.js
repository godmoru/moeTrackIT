const { Op } = require('sequelize');
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');
const NotificationService = require('./notification.service.js');
const EarlyWarningService = require('./earlyWarning.service.js');

class ExpenditureService {
    /**
     * Create a new expenditure
     * @param {Object} expenditureData - Expenditure data
     * @param {string} userId - ID of the user creating the expenditure
     * @returns {Promise<Object>} Created expenditure
     */
    static async createExpenditure(expenditureData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            // Check if budget line item exists
            const lineItem = await db.BudgetLineItem.findByPk(expenditureData.budgetLineItemId, {
                transaction,
                include: [{ model: db.Budget, as: 'budget' }],
            });

            if (!lineItem) {
                throw new AppError('Budget line item not found', 404);
            }

            // Check if expenditure amount is within available balance
            const canAccommodate = await lineItem.canAccommodateExpenditure(expenditureData.amount);
            if (!canAccommodate) {
                const balance = await lineItem.calculateBalance();
                throw new AppError(
                    `Insufficient balance. Available: ${balance}, Requested: ${expenditureData.amount}`,
                    400
                );
            }

            // Generate reference number
            const referenceNumber = await db.Expenditure.generateReferenceNumber();

            // Create the expenditure
            const expenditure = await db.Expenditure.create(
                {
                    ...expenditureData,
                    referenceNumber,
                    budgetId: lineItem.budgetId,
                    createdBy: userId,
                    status: 'draft',
                },
                { transaction }
            );

            await transaction.commit();
            return expenditure;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get expenditure by ID
     * @param {string} expenditureId - Expenditure ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Expenditure with related data
     */
    static async getExpenditureById(expenditureId, options = {}) {
        const { includeAttachments = true, includeRetirement = true } = options;

        const include = [
            {
                model: db.BudgetLineItem,
                as: 'lineItem',
                attributes: ['id', 'code', 'name', 'amount', 'balance'],
            },
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
            {
                model: db.User,
                as: 'creator',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: db.User,
                as: 'approver',
                attributes: ['id', 'name', 'email'],
            },
        ];

        if (includeAttachments) {
            include.push({
                model: db.Attachment,
                as: 'attachments',
            });
        }

        if (includeRetirement) {
            include.push({
                model: db.ExpenditureRetirement,
                as: 'retirement',
            });
        }

        const expenditure = await db.Expenditure.findByPk(expenditureId, {
            include,
        });

        if (!expenditure) {
            throw new AppError('Expenditure not found', 404);
        }

        return expenditure;
    }

    /**
     * Get all expenditures with pagination and filtering
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Paginated expenditures
     */
    static async getAllExpenditures(query = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            budgetId,
            budgetLineItemId,
            mdaId,
            status,
            dateFrom,
            dateTo,
        } = query;

        const offset = (page - 1) * limit;
        const where = {};

        // Apply filters
        if (search) {
            where[Op.or] = [
                { referenceNumber: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { beneficiaryName: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (budgetId) where.budgetId = budgetId;
        if (budgetLineItemId) where.budgetLineItemId = budgetLineItemId;
        if (mdaId) where.mdaId = mdaId;
        if (status) where.status = status;

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date[Op.gte] = dateFrom;
            if (dateTo) where.date[Op.lte] = dateTo;
        }

        const { count, rows: expenditures } = await db.Expenditure.findAndCountAll({
            where,
            include: [
                {
                    model: db.BudgetLineItem,
                    as: 'lineItem',
                    attributes: ['id', 'code', 'name'],
                },
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
                {
                    model: db.User,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            distinct: true,
        });

        return {
            totalItems: count,
            items: expenditures,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
        };
    }

    /**
     * Update an expenditure
     * @param {string} expenditureId - Expenditure ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - ID of the user updating the expenditure
     * @returns {Promise<Object>} Updated expenditure
     */
    static async updateExpenditure(expenditureId, updateData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const expenditure = await db.Expenditure.findByPk(expenditureId, { transaction });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            // Only allow editing if status is draft
            if (!expenditure.canEdit()) {
                throw new AppError('Only draft expenditures can be edited', 400);
            }

            // If amount is being updated, check balance
            if (updateData.amount && updateData.amount !== expenditure.amount) {
                const lineItem = await db.BudgetLineItem.findByPk(expenditure.budgetLineItemId, {
                    transaction,
                });

                const currentBalance = await lineItem.calculateBalance();
                const availableBalance = currentBalance + parseFloat(expenditure.amount);

                if (parseFloat(updateData.amount) > availableBalance) {
                    throw new AppError(
                        `Insufficient balance. Available: ${availableBalance}, Requested: ${updateData.amount}`,
                        400
                    );
                }
            }

            await expenditure.update(
                {
                    ...updateData,
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return expenditure;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Submit expenditure for approval
     * @param {string} expenditureId - Expenditure ID
     * @param {string} userId - ID of the user submitting
     * @returns {Promise<Object>} Updated expenditure
     */
    static async submitForApproval(expenditureId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const expenditure = await db.Expenditure.findByPk(expenditureId, { transaction });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            if (expenditure.status !== 'draft') {
                throw new AppError('Only draft expenditures can be submitted', 400);
            }

            await expenditure.update(
                {
                    status: 'submitted',
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();

            // Send notification to approvers
            await NotificationService.notifyExpenditureSubmitted(expenditure);

            return expenditure;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Approve an expenditure
     * @param {string} expenditureId - Expenditure ID
     * @param {string} userId - ID of the user approving
     * @returns {Promise<Object>} Updated expenditure
     */
    static async approveExpenditure(expenditureId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const expenditure = await db.Expenditure.findByPk(expenditureId, {
                transaction,
                include: [{ model: db.BudgetLineItem, as: 'lineItem' }],
            });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            if (!expenditure.canApprove()) {
                throw new AppError('Only submitted expenditures can be approved', 400);
            }

            // Check balance one more time
            const lineItem = expenditure.lineItem;
            const canAccommodate = await lineItem.canAccommodateExpenditure(expenditure.amount);

            if (!canAccommodate) {
                throw new AppError('Insufficient balance to approve this expenditure', 400);
            }

            // Approve the expenditure
            await expenditure.update(
                {
                    status: 'approved',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    updatedBy: userId,
                },
                { transaction }
            );

            // Update line item balance
            const newBalance = await lineItem.calculateBalance();
            await lineItem.update({ balance: newBalance }, { transaction });

            await transaction.commit();

            // Check for early warnings
            await EarlyWarningService.checkBudgetThresholds(lineItem.id);

            // Send notification to creator
            await NotificationService.notifyExpenditureApproved(expenditure);

            return expenditure;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject an expenditure
     * @param {string} expenditureId - Expenditure ID
     * @param {string} userId - ID of the user rejecting
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Updated expenditure
     */
    static async rejectExpenditure(expenditureId, userId, reason) {
        const transaction = await db.sequelize.transaction();

        try {
            const expenditure = await db.Expenditure.findByPk(expenditureId, { transaction });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            if (!expenditure.canApprove()) {
                throw new AppError('Only submitted expenditures can be rejected', 400);
            }

            if (!reason) {
                throw new AppError('Rejection reason is required', 400);
            }

            await expenditure.update(
                {
                    status: 'rejected',
                    rejectionReason: reason,
                    approvedBy: userId,
                    approvedAt: new Date(),
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();

            // Send notification to creator
            await NotificationService.notifyExpenditureRejected(expenditure);

            return expenditure;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete an expenditure
     * @param {string} expenditureId - Expenditure ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteExpenditure(expenditureId) {
        const transaction = await db.sequelize.transaction();

        try {
            const expenditure = await db.Expenditure.findByPk(expenditureId, { transaction });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            // Only allow deletion if status is draft
            if (!expenditure.canDelete()) {
                throw new AppError('Only draft expenditures can be deleted', 400);
            }

            // Delete related attachments
            await db.Attachment.destroy({
                where: { expenditureId },
                transaction,
            });

            await expenditure.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get expenditure statistics
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Expenditure statistics
     */
    static async getExpenditureStats(filters = {}) {
        const { mdaId, budgetId, fiscalYear } = filters;
        const where = {};

        if (mdaId) where.mdaId = mdaId;
        if (budgetId) where.budgetId = budgetId;

        if (fiscalYear) {
            const budget = await db.Budget.findOne({
                where: { fiscalYear },
                attributes: ['id'],
            });
            if (budget) where.budgetId = budget.id;
        }

        const totalExpenditures = await db.Expenditure.count({ where });

        const approvedExpenditures = await db.Expenditure.count({
            where: { ...where, status: 'approved' },
        });

        const pendingExpenditures = await db.Expenditure.count({
            where: { ...where, status: 'submitted' },
        });

        const totalAmount = await db.Expenditure.sum('amount', {
            where: { ...where, status: 'approved' },
        });

        return {
            totalExpenditures,
            approvedExpenditures,
            pendingExpenditures,
            totalAmount: totalAmount || 0,
        };
    }
}

module.exports = ExpenditureService;
