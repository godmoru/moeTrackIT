const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');
const NotificationService = require('./notification.service.js');

class EarlyWarningService {
    // Warning thresholds
    static THRESHOLDS = {
        MEDIUM: 75,
        HIGH: 85,
        CRITICAL: 95,
    };

    /**
     * Check budget thresholds for a line item
     * @param {number} lineItemId - Budget line item ID
     * @returns {Promise<Object|null>} Warning details if threshold crossed
     */
    static async checkBudgetThresholds(lineItemId) {
        try {
            const lineItem = await db.BudgetLineItem.findByPk(lineItemId, {
                include: [
                    { model: db.Budget, as: 'budget' },
                    { model: db.Mda, as: 'mda' },
                ],
            });

            if (!lineItem) {
                throw new AppError('Budget line item not found', 404);
            }

            const utilizationPercentage = await lineItem.getUtilizationPercentage();
            const warningStatus = await lineItem.getWarningStatus();

            // Only trigger if a threshold is crossed
            if (warningStatus.level !== 'normal') {
                await this.triggerWarningNotifications(lineItem, warningStatus);

                return {
                    lineItemId: lineItem.id,
                    lineItemCode: lineItem.code,
                    lineItemName: lineItem.name,
                    utilizationPercentage,
                    threshold: warningStatus.threshold,
                    level: warningStatus.level,
                    amount: parseFloat(lineItem.amount),
                    balance: await lineItem.calculateBalance(),
                };
            }

            return null;
        } catch (error) {
            console.error('Error checking budget thresholds:', error);
            throw error;
        }
    }

    /**
     * Trigger warning notifications to stakeholders
     * @param {Object} lineItem - Budget line item
     * @param {Object} warningStatus - Warning status details
     * @returns {Promise<void>}
     */
    static async triggerWarningNotifications(lineItem, warningStatus) {
        try {
            // Get stakeholders for the MDA
            const stakeholders = await db.User.findAll({
                where: {
                    mdaId: lineItem.mdaId,
                    role: { [db.Sequelize.Op.in]: ['admin', 'budget_manager', 'director'] },
                },
            });

            // Send notifications
            await NotificationService.notifyBudgetWarning(lineItem, warningStatus, stakeholders);

            // Log the warning
            console.log(`Budget warning triggered for line item ${lineItem.code}: ${warningStatus.level} (${warningStatus.threshold}%)`);
        } catch (error) {
            console.error('Error triggering warning notifications:', error);
            // Don't throw error to avoid breaking the main flow
        }
    }

    /**
     * Get all warnings for an MDA
     * @param {string} mdaId - MDA ID
     * @returns {Promise<Array>} List of warnings
     */
    static async getWarningsByMda(mdaId) {
        try {
            const lineItems = await db.BudgetLineItem.findAll({
                where: { mdaId },
                include: [
                    { model: db.Budget, as: 'budget' },
                    { model: db.Mda, as: 'mda' },
                ],
            });

            const warnings = [];

            for (const lineItem of lineItems) {
                const utilizationPercentage = await lineItem.getUtilizationPercentage();
                const warningStatus = await lineItem.getWarningStatus();

                if (warningStatus.level !== 'normal') {
                    warnings.push({
                        lineItemId: lineItem.id,
                        lineItemCode: lineItem.code,
                        lineItemName: lineItem.name,
                        budgetTitle: lineItem.budget.title,
                        fiscalYear: lineItem.fiscalYear,
                        utilizationPercentage,
                        threshold: warningStatus.threshold,
                        level: warningStatus.level,
                        amount: parseFloat(lineItem.amount),
                        balance: await lineItem.calculateBalance(),
                    });
                }
            }

            return warnings;
        } catch (error) {
            console.error('Error getting warnings by MDA:', error);
            throw error;
        }
    }

    /**
     * Get system-wide warnings summary
     * @returns {Promise<Object>} Warnings summary
     */
    static async getWarningsSummary() {
        try {
            const allLineItems = await db.BudgetLineItem.findAll({
                include: [
                    { model: db.Budget, as: 'budget' },
                    { model: db.Mda, as: 'mda' },
                ],
            });

            const summary = {
                total: 0,
                medium: 0,
                high: 0,
                critical: 0,
                warnings: [],
            };

            for (const lineItem of allLineItems) {
                const utilizationPercentage = await lineItem.getUtilizationPercentage();
                const warningStatus = await lineItem.getWarningStatus();

                if (warningStatus.level !== 'normal') {
                    summary.total++;
                    summary[warningStatus.level]++;

                    summary.warnings.push({
                        lineItemId: lineItem.id,
                        lineItemCode: lineItem.code,
                        lineItemName: lineItem.name,
                        mdaName: lineItem.mda.name,
                        budgetTitle: lineItem.budget.title,
                        fiscalYear: lineItem.fiscalYear,
                        utilizationPercentage,
                        threshold: warningStatus.threshold,
                        level: warningStatus.level,
                        amount: parseFloat(lineItem.amount),
                        balance: await lineItem.calculateBalance(),
                    });
                }
            }

            // Sort warnings by utilization percentage (highest first)
            summary.warnings.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

            return summary;
        } catch (error) {
            console.error('Error getting warnings summary:', error);
            throw error;
        }
    }

    /**
     * Check if a line item has crossed a new threshold
     * @param {number} lineItemId - Budget line item ID
     * @param {number} previousUtilization - Previous utilization percentage
     * @returns {Promise<boolean>} True if new threshold crossed
     */
    static async hasNewThresholdCrossed(lineItemId, previousUtilization) {
        const lineItem = await db.BudgetLineItem.findByPk(lineItemId);

        if (!lineItem) {
            return false;
        }

        const currentUtilization = await lineItem.getUtilizationPercentage();

        // Check if crossed from below to above any threshold
        const thresholds = [this.THRESHOLDS.MEDIUM, this.THRESHOLDS.HIGH, this.THRESHOLDS.CRITICAL];

        for (const threshold of thresholds) {
            if (previousUtilization < threshold && currentUtilization >= threshold) {
                return true;
            }
        }

        return false;
    }
}

module.exports = EarlyWarningService;
