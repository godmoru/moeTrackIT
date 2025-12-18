import { Op } from 'sequelize';
import AppError from '../../utils/appError.js';
import db from '../../models/v1/index.js';

class BudgetVersionService {
  /**
   * Create a new version of a budget
   * @param {string} budgetId - Original budget ID
   * @param {Object} versionData - Version data
   * @param {string} userId - ID of the user creating the version
   * @returns {Promise<Object>} Created budget version
   */
  static async createBudgetVersion(budgetId, versionData, userId) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const originalBudget = await db.Budget.findByPk(budgetId, {
        include: [
          {
            model: db.BudgetLineItem,
            as: 'lineItems',
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          },
        ],
        transaction,
      });

      if (!originalBudget) {
        throw new AppError('Original budget not found', 404);
      }

      // Get the next version number
      const lastVersion = await db.BudgetVersion.findOne({
        where: { budgetId },
        order: [['version', 'DESC']],
        transaction,
      });

      const newVersionNumber = lastVersion ? lastVersion.version + 1 : 1;

      // Create the version record
      const version = await db.BudgetVersion.create(
        {
          budgetId,
          version: newVersionNumber,
          changes: versionData.changes || {},
          notes: versionData.notes,
          createdBy: userId,
        },
        { transaction }
      );

      // If this is the first version, update the original budget to point to it
      if (newVersionNumber === 1) {
        await originalBudget.update(
          { currentVersionId: version.id },
          { transaction }
        );
      }

      await transaction.commit();
      return version;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all versions of a budget
   * @param {string} budgetId - Budget ID
   * @returns {Promise<Array>} List of budget versions
   */
  static async getBudgetVersions(budgetId) {
    const versions = await db.BudgetVersion.findAll({
      where: { budgetId },
      order: [['version', 'DESC']],
      include: [
        {
          model: db.User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return versions;
  }

  /**
   * Get a specific version of a budget
   * @param {string} versionId - Version ID
   * @returns {Promise<Object>} Budget version with details
   */
  static async getBudgetVersion(versionId) {
    const version = await db.BudgetVersion.findByPk(versionId, {
      include: [
        {
          model: db.Budget,
          as: 'budget',
          include: [
            {
              model: db.BudgetLineItem,
              as: 'lineItems',
              attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            },
          ],
        },
        {
          model: db.User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!version) {
      throw new AppError('Budget version not found', 404);
    }

    return version;
  }

  /**
   * Restore a specific version of a budget
   * @param {string} versionId - Version ID to restore
   * @param {string} userId - ID of the user performing the restore
   * @returns {Promise<Object>} Restored budget
   */
  static async restoreBudgetVersion(versionId, userId) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const version = await db.BudgetVersion.findByPk(versionId, {
        include: [
          {
            model: db.Budget,
            as: 'budget',
            include: [
              {
                model: db.BudgetLineItem,
                as: 'lineItems',
              },
            ],
          },
        ],
        transaction,
      });

      if (!version) {
        throw new AppError('Budget version not found', 404);
      }

      const budget = version.budget;
      
      // Create a new version before restoring
      await this.createBudgetVersion(
        budget.id,
        {
          changes: { restoredFromVersion: versionId },
          notes: `Restored from version ${version.version}`,
        },
        userId,
        transaction
      );

      // Apply the changes from the version
      if (version.changes) {
        // Apply changes to the budget
        await budget.update(version.changes, { transaction });
      }

      // Update the current version pointer
      await budget.update(
        { currentVersionId: version.id },
        { transaction }
      );

      await transaction.commit();
      return budget;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

const budgetVersionService = new BudgetVersionService();

export default budgetVersionService;
