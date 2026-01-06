const { Op } = require('sequelize');
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');

class ExpenditureCategoryService {
    /**
     * Create a new expenditure category
     * @param {Object} categoryData - Category data
     * @param {string} userId - ID of the user creating the category
     * @returns {Promise<Object>} Created category
     */
    static async createExpenditureCategory(categoryData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            // Generate reference number
            const reference = await this.generateReferenceNumber();

            // Create the category
            const category = await db.ExpenditureCategory.create(
                {
                    ...categoryData,
                    reference,
                    createdBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return category;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get all expenditure categories with pagination and filtering
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Paginated categories
     */
    static async getAllExpenditureCategories(query = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            status,
        } = query;

        const offset = (page - 1) * limit;
        const where = {};

        // Apply filters
        if (search) {
            where[Op.or] = [
                { reference: { [Op.iLike]: `%${search}%` } },
                { cat_name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (status) where.status = status;

        const { count, rows: categories } = await db.ExpenditureCategory.findAndCountAll({
            where,
            include: [
                {
                    model: db.User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            distinct: true,
        });

        return {
            totalItems: count,
            items: categories,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
        };
    }

    /**
     * Get expenditure category by ID
     * @param {string} categoryId - Category ID
     * @returns {Promise<Object>} Category with related data
     */
    static async getExpenditureCategoryById(categoryId) {
        const category = await db.ExpenditureCategory.findByPk(categoryId, {
            include: [
                {
                    model: db.User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: db.Expenditure,
                    as: 'categoryId',
                    attributes: ['id', 'referenceNumber', 'amount', 'status'],
                },
            ],
        });

        if (!category) {
            throw new AppError('Expenditure category not found', 404);
        }

        return category;
    }

    /**
     * Update an expenditure category
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - ID of the user updating the category
     * @returns {Promise<Object>} Updated category
     */
    static async updateExpenditureCategory(categoryId, updateData, userId) {
        const transaction = await db.sequelize.transaction();

        try {
            const category = await db.ExpenditureCategory.findByPk(categoryId, { transaction });

            if (!category) {
                throw new AppError('Expenditure category not found', 404);
            }

            await category.update(
                {
                    ...updateData,
                    updatedBy: userId,
                },
                { transaction }
            );

            await transaction.commit();
            return category;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete an expenditure category
     * @param {string} categoryId - Category ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteExpenditureCategory(categoryId) {
        const transaction = await db.sequelize.transaction();

        try {
            const category = await db.ExpenditureCategory.findByPk(categoryId, { transaction });

            if (!category) {
                throw new AppError('Expenditure category not found', 404);
            }

            // Check if category has associated expenditures
            const expenditureCount = await db.Expenditure.count({
                where: { expenditureCategoryId: categoryId },
                transaction,
            });

            if (expenditureCount > 0) {
                throw new AppError(
                    'Cannot delete category with associated expenditures',
                    400
                );
            }

            await category.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Generate unique reference number
     */
    static async generateReferenceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // Find the last category for this month
        const lastCategory = await db.ExpenditureCategory.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('DATE_FORMAT', db.sequelize.col('createdAt'), '%Y-%m'),
                `${year}-${month}`
            ),
            order: [['createdAt', 'DESC']],
        });

        let sequence = 1;
        if (lastCategory && lastCategory.reference) {
            const lastSequence = parseInt(lastCategory.reference.split('-').pop());
            sequence = lastSequence + 1;
        }

        return `CAT-${year}${month}-${String(sequence).padStart(4, '0')}`;
    }
}

module.exports = ExpenditureCategoryService;
