import { Op } from 'sequelize';
import AppError from '../../utils/appError.js';
import db from '../../models/index.js';
import NotificationService from './notification.service.js';

class ExpenditureRetirementService {
    /**
     * Create a new retirement
     * @param {Object} retirementData - Retirement data
     * @param {string} userId - ID of the user creating the retirement
     * @returns {Promise<Object>} Created retirement
     */
    static async createRetirement(retirementData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            // Check if expenditure exists and is approved
            const expenditure = await db.Expenditure.findByPk(retirementData.expenditureId, {
                transaction,
            });

            if (!expenditure) {
                throw new AppError('Expenditure not found', 404);
            }

            if (expenditure.status !== 'approved') {
                throw new AppError('Only approved expenditures can be retired', 400);
            }

            // Check if retirement already exists for this expenditure
            const existingRetirement = await db.ExpenditureRetirement.findOne({
                where: { expenditureId: retirementData.expenditureId },
                transaction,
            });

            if (existingRetirement) {
                throw new AppError('A retirement already exists for this expenditure', 400);
            }

            // Validate retirement amount
            if (parseFloat(retirementData.amountRetired) > parseFloat(expenditure.amount)) {
                throw new AppError('Retirement amount cannot exceed expenditure amount', 400);
            }

            // Calculate balance unretired
            const balanceUnretired = parseFloat(expenditure.amount) - parseFloat(retirementData.amountRetired);

            // Generate retirement number
            const retirementNumber = await db.ExpenditureRetirement.generateRetirementNumber();

            // Create the retirement
            const retirement = await db.ExpenditureRetirement.create(
                {
                    ...retirementData,
                    retirementNumber,
                    balanceUnretired,
                    createdBy: userId,
                    status: 'draft',
                },
                { transaction }
            );

            await transaction.commit();
            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get retirement by ID
     * @param {string} retirementId - Retirement ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Retirement with related data
     */
    static async getRetirementById(retirementId, options = {}) {
        const { includeAttachments = true } = options;

        const include = [
            {
                model: db.Expenditure,
                as: 'expenditure',
                include: [
                    {
                        model: db.BudgetLineItem,
                        as: 'lineItem',
                        attributes: ['id', 'code', 'name'],
                    },
                ],
            },
            {
                model: db.User,
                as: 'creator',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: db.User,
                as: 'reviewer',
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
                model: db.RetirementAttachment,
                as: 'attachments',
            });
        }

        const retirement = await db.ExpenditureRetirement.findByPk(retirementId, {
            include,
        });

        if (!retirement) {
            throw new AppError('Retirement not found', 404);
        }

        return retirement;
    }

    /**
     * Get all retirements with pagination and filtering
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Paginated retirements
     */
    static async getAllRetirements(query = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            status,
            dateFrom,
            dateTo,
        } = query;

        const offset = (page - 1) * limit;
        const where = {};

        // Apply filters
        if (search) {
            where[Op.or] = [
                { retirementNumber: { [Op.iLike]: `%${search}%` } },
                { purpose: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (status) where.status = status;

        if (dateFrom || dateTo) {
            where.retirementDate = {};
            if (dateFrom) where.retirementDate[Op.gte] = dateFrom;
            if (dateTo) where.retirementDate[Op.lte] = dateTo;
        }

        const { count, rows: retirements } = await db.ExpenditureRetirement.findAndCountAll({
            where,
            include: [
                {
                    model: db.Expenditure,
                    as: 'expenditure',
                    attributes: ['id', 'referenceNumber', 'amount'],
                    include: [
                        {
                            model: db.BudgetLineItem,
                            as: 'lineItem',
                            attributes: ['id', 'code', 'name'],
                        },
                    ],
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
            items: retirements,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
        };
    }

    /**
     * Update a retirement
     * @param {string} retirementId - Retirement ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - ID of the user updating the retirement
     * @returns {Promise<Object>} Updated retirement
     */
    static async updateRetirement(retirementId, updateData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, {
                transaction,
                include: [{ model: db.Expenditure, as: 'expenditure' }],
            });

            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            // Only allow editing if status is draft
            if (!retirement.canEdit()) {
                throw new AppError('Only draft retirements can be edited', 400);
            }

            // If amount is being updated, recalculate balance
            if (updateData.amountRetired) {
                const expenditureAmount = parseFloat(retirement.expenditure.amount);

                if (parseFloat(updateData.amountRetired) > expenditureAmount) {
                    throw new AppError('Retirement amount cannot exceed expenditure amount', 400);
                }

                updateData.balanceUnretired = expenditureAmount - parseFloat(updateData.amountRetired);
            }

            await retirement.update(
                {
                    ...updateData,
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Submit retirement for review
     * @param {string} retirementId - Retirement ID
     * @param {string} userId - ID of the user submitting
     * @returns {Promise<Object>} Updated retirement
     */
    static async submitRetirement(retirementId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, { transaction });

            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            if (retirement.status !== 'draft') {
                throw new AppError('Only draft retirements can be submitted', 400);
            }

            await retirement.update(
                {
                    status: 'submitted',
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();

            // Send notification to reviewers
            await NotificationService.notifyRetirementSubmitted(retirement);

            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Review a retirement
     * @param {string} retirementId - Retirement ID
     * @param {string} userId - ID of the user reviewing
     * @param {string} status - Review status ('under_review' or 'rejected')
     * @param {string} remarks - Review remarks
     * @returns {Promise<Object>} Updated retirement
     */
    static async reviewRetirement(retirementId, userId, status, remarks) {
        const transaction = await db.sequelize.transaction();

        try {
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, { transaction });

            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            if (!retirement.canReview()) {
                throw new AppError('Only submitted retirements can be reviewed', 400);
            }

            const updateData = {
                status,
                reviewedBy: userId,
                reviewedAt: new Date(),
                updatedBy: userId,
            };

            if (remarks) {
                updateData.remarks = remarks;
            }

            if (status === 'rejected') {
                updateData.rejectionReason = remarks;
            }

            await retirement.update(updateData, { transaction });

            await transaction.commit();
            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Approve a retirement
     * @param {string} retirementId - Retirement ID
     * @param {string} userId - ID of the user approving
     * @returns {Promise<Object>} Updated retirement
     */
    static async approveRetirement(retirementId, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, { transaction });

            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            if (!retirement.canApprove()) {
                throw new AppError('Only reviewed retirements can be approved', 400);
            }

            await retirement.update(
                {
                    status: 'approved',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();

            // Send notification to creator
            await NotificationService.notifyRetirementApproved(retirement);

            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject a retirement
     * @param {string} retirementId - Retirement ID
     * @param {string} userId - ID of the user rejecting
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Updated retirement
     */
    static async rejectRetirement(retirementId, userId, reason) {
        const transaction = await db.sequelize.transaction();

        try {
            const retirement = await db.ExpenditureRetirement.findByPk(retirementId, { transaction });

            if (!retirement) {
                throw new AppError('Retirement not found', 404);
            }

            if (!reason) {
                throw new AppError('Rejection reason is required', 400);
            }

            await retirement.update(
                {
                    status: 'rejected',
                    rejectionReason: reason,
                    reviewedBy: userId,
                    reviewedAt: new Date(),
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return retirement;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get retirement statistics
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Retirement statistics
     */
    static async getRetirementStats(filters = {}) {
        const where = {};

        const totalRetirements = await db.ExpenditureRetirement.count({ where });

        const approvedRetirements = await db.ExpenditureRetirement.count({
            where: { ...where, status: 'approved' },
        });

        const pendingRetirements = await db.ExpenditureRetirement.count({
            where: { ...where, status: { [Op.in]: ['submitted', 'under_review'] } },
        });

        const totalAmountRetired = await db.ExpenditureRetirement.sum('amountRetired', {
            where: { ...where, status: 'approved' },
        });

        return {
            totalRetirements,
            approvedRetirements,
            pendingRetirements,
            totalAmountRetired: totalAmountRetired || 0,
        };
    }
}

export default ExpenditureRetirementService;
