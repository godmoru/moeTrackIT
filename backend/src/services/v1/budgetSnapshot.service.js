import { Op } from 'sequelize';
import AppError from '../../utils/appError.js';
import db from '../../models/v1/index.js';

class BudgetSnapshotService {
  /**
   * Create a new budget snapshot
   * @param {string} budgetId - Budget ID
   * @param {Object} options - Snapshot options
   * @param {string} options.snapshotType - Type of snapshot (e.g., 'monthly', 'quarterly', 'annual', 'ad-hoc')
   * @param {string} options.notes - Optional notes about the snapshot
   * @param {string} userId - ID of the user creating the snapshot
   * @returns {Promise<Object>} Created budget snapshot
   */
  static async createBudgetSnapshot(budgetId, options, userId) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const budget = await db.Budget.findByPk(budgetId, {
        include: [
          {
            model: db.BudgetLineItem,
            as: 'lineItems',
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          },
          {
            model: db.Mda,
            as: 'mda',
            attributes: ['id', 'name', 'code'],
          },
        ],
        transaction,
      });

      if (!budget) {
        throw new AppError('Budget not found', 404);
      }

      // Create a deep copy of the budget data
      const budgetData = JSON.parse(JSON.stringify(budget.get({ plain: true })));
      
      // Remove unnecessary fields
      delete budgetData.createdAt;
      delete budgetData.updatedAt;
      delete budgetData.deletedAt;
      
      // Create the snapshot
      const snapshot = await db.BudgetSnapshot.create(
        {
          budgetId,
          snapshotDate: new Date(),
          snapshotType: options.snapshotType || 'ad-hoc',
          fiscalYear: budget.fiscalYear,
          data: budgetData,
          notes: options.notes,
          createdBy: userId,
          metadata: {
            mdaName: budget.mda?.name,
            mdaCode: budget.mda?.code,
            budgetTitle: budget.title,
            budgetCode: budget.code,
          },
        },
        { transaction }
      );

      // If this is a baseline snapshot, update the budget
      if (options.isBaseline) {
        await db.BudgetSnapshot.update(
          { isBaseline: false },
          {
            where: {
              budgetId,
              id: { [Op.ne]: snapshot.id },
            },
            transaction,
          }
        );

        await snapshot.update({ isBaseline: true }, { transaction });
      }

      await transaction.commit();
      return snapshot;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all snapshots for a budget
   * @param {string} budgetId - Budget ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of budget snapshots
   */
  static async getBudgetSnapshots(budgetId, options = {}) {
    const { snapshotType, startDate, endDate } = options;
    
    const where = { budgetId };
    
    if (snapshotType) {
      where.snapshotType = snapshotType;
    }
    
    if (startDate || endDate) {
      where.snapshotDate = {};
      if (startDate) where.snapshotDate[Op.gte] = new Date(startDate);
      if (endDate) where.snapshotDate[Op.lte] = new Date(endDate);
    }

    const snapshots = await db.BudgetSnapshot.findAll({
      where,
      order: [['snapshotDate', 'DESC']],
      include: [
        {
          model: db.User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return snapshots;
  }

  /**
   * Get a specific budget snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} Budget snapshot with details
   */
  static async getBudgetSnapshot(snapshotId) {
    const snapshot = await db.BudgetSnapshot.findByPk(snapshotId, {
      include: [
        {
          model: db.User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!snapshot) {
      throw new AppError('Budget snapshot not found', 404);
    }

    return snapshot;
  }

  /**
   * Compare two budget snapshots
   * @param {string} snapshotId1 - First snapshot ID
   * @param {string} snapshotId2 - Second snapshot ID
   * @returns {Promise<Object>} Comparison result
   */
  static async compareSnapshots(snapshotId1, snapshotId2) {
    const [snapshot1, snapshot2] = await Promise.all([
      this.getBudgetSnapshot(snapshotId1),
      this.getBudgetSnapshot(snapshotId2),
    ]);

    if (snapshot1.budgetId !== snapshot2.budgetId) {
      throw new AppError('Cannot compare snapshots from different budgets', 400);
    }

    const compareLineItems = (items1, items2) => {
      const result = {
        added: [],
        removed: [],
        modified: [],
        unchanged: [],
      };

      const items1Map = new Map(items1.map(item => [item.id, item]));
      const items2Map = new Map(items2.map(item => [item.id, item]));

      // Find added and modified items
      for (const [id, item2] of items2Map.entries()) {
        const item1 = items1Map.get(id);
        if (!item1) {
          result.added.push(item2);
        } else {
          const changes = [];
          for (const key in item1) {
            if (item1[key] !== item2[key]) {
              changes.push({
                field: key,
                oldValue: item1[key],
                newValue: item2[key],
              });
            }
          }
          if (changes.length > 0) {
            result.modified.push({
              id,
              code: item2.code,
              description: item2.description,
              changes,
            });
          } else {
            result.unchanged.push(item2);
          }
        }
      }

      // Find removed items
      for (const [id, item1] of items1Map.entries()) {
        if (!items2Map.has(id)) {
          result.removed.push(item1);
        }
      }

      return result;
    };

    const budget1 = snapshot1.data;
    const budget2 = snapshot2.data;

    // Compare budget fields
    const budgetChanges = [];
    for (const key in budget1) {
      if (key !== 'lineItems' && budget1[key] !== budget2[key]) {
        budgetChanges.push({
          field: key,
          oldValue: budget1[key],
          newValue: budget2[key],
        });
      }
    }

    // Compare line items
    const lineItemComparison = compareLineItems(
      budget1.lineItems || [],
      budget2.lineItems || []
    );

    return {
      snapshot1: {
        id: snapshot1.id,
        snapshotDate: snapshot1.snapshotDate,
        snapshotType: snapshot1.snapshotType,
      },
      snapshot2: {
        id: snapshot2.id,
        snapshotDate: snapshot2.snapshotDate,
        snapshotType: snapshot2.snapshotType,
      },
      budgetChanges,
      lineItemComparison,
      summary: {
        totalItems1: (budget1.lineItems || []).length,
        totalItems2: (budget2.lineItems || []).length,
        added: lineItemComparison.added.length,
        removed: lineItemComparison.removed.length,
        modified: lineItemComparison.modified.length,
        unchanged: lineItemComparison.unchanged.length,
      },
    };
  }

  /**
   * Get the baseline snapshot for a budget
   * @param {string} budgetId - Budget ID
   * @returns {Promise<Object>} Baseline budget snapshot
   */
  static async getBaselineSnapshot(budgetId) {
    const snapshot = await db.BudgetSnapshot.findOne({
      where: { 
        budgetId,
        isBaseline: true,
      },
    });

    if (!snapshot) {
      throw new AppError('Baseline snapshot not found', 404);
    }

    return snapshot;
  }
}

export { BudgetSnapshotService };
export default BudgetSnapshotService;
