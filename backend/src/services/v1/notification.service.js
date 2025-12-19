const { Op } = require('sequelize');
const AppError = require('../../utils/appError.js');
const db = require('../../../models/index.js');
const emailService = require('./email.service.js'); // You'll need to implement this

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.userId - ID of the user to notify
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type (e.g., 'info', 'warning', 'success', 'error')
   * @param {string} notificationData.referenceType - Type of the referenced entity (e.g., 'budget', 'expenditure')
   * @param {string} notificationData.referenceId - ID of the referenced entity
   * @param {Object} notificationData.metadata - Additional metadata
   * @param {boolean} notificationData.sendEmail - Whether to send an email notification
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(notificationData) {
    const {
      userId,
      title,
      message,
      type = 'info',
      referenceType = null,
      referenceId = null,
      metadata = {},
      sendEmail = false,
    } = notificationData;

    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type,
      referenceType,
      referenceId,
      metadata,
      isRead: false,
    });

    // Send email notification if requested
    if (sendEmail) {
      await this.sendEmailNotification(notification);
    }

    // Emit real-time notification (if using WebSockets)
    await this.emitRealTimeNotification(notification);

    return notification;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {boolean} options.unreadOnly - Only return unread notifications
   * @param {number} options.limit - Maximum number of notifications to return
   * @param {number} options.offset - Number of notifications to skip
   * @returns {Promise<Object>} Paginated notifications
   */
  static async getUserNotifications(userId, options = {}) {
    const { unreadOnly = false, limit = 20, offset = 0 } = options;

    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const { count, rows: notifications } = await db.Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return {
      totalItems: count,
      items: notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: Math.floor(offset / limit) + 1,
    };
  }

  /**
   * Mark notifications as read
   * @param {string} userId - User ID
   * @param {string|Array<string>} notificationIds - Single notification ID or array of IDs
   * @returns {Promise<number>} Number of updated notifications
   */
  static async markAsRead(userId, notificationIds) {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    const [updatedCount] = await db.Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          id: { [Op.in]: ids },
          userId,
          isRead: false,
        },
      }
    );

    return updatedCount;
  }

  /**
   * Mark all user notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of updated notifications
   */
  static async markAllAsRead(userId) {
    const [updatedCount] = await db.Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    return updatedCount;
  }

  /**
   * Delete a notification
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async deleteNotification(userId, notificationId) {
    const deletedCount = await db.Notification.destroy({
      where: {
        id: notificationId,
        userId,
      },
    });

    return deletedCount > 0;
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification statistics
   */
  static async getNotificationStats(userId) {
    const [total, unread] = await Promise.all([
      db.Notification.count({ where: { userId } }),
      db.Notification.count({ where: { userId, isRead: false } }),
    ]);

    const recentUnread = await db.Notification.findAll({
      where: { userId, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return {
      total,
      unread,
      recentUnread,
    };
  }

  /**
   * Send email notification
   * @private
   */
  static async sendEmailNotification(notification) {
    try {
      const user = await db.User.findByPk(notification.userId, {
        attributes: ['email', 'firstName', 'lastName'],
      });

      if (!user) return;

      const emailData = {
        to: user.email,
        subject: notification.title,
        template: 'notification',
        context: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          title: notification.title,
          message: notification.message,
          notificationType: notification.type,
          referenceType: notification.referenceType,
          referenceId: notification.referenceId,
          ...notification.metadata,
        },
      };

      await emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Emit real-time notification (for WebSockets)
   * @private
   */
  static async emitRealTimeNotification(notification) {
    try {
      // This is a placeholder for your real-time notification system
      // In a real app, you would use Socket.IO, Pusher, or a similar service
      const { default: io } = await import('../../socket.js'); // Assuming you have a socket setup

      if (io) {
        io.to(`user_${notification.userId}`).emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          referenceType: notification.referenceType,
          referenceId: notification.referenceId,
          createdAt: notification.createdAt,
          metadata: notification.metadata,
        });
      }
    } catch (error) {
      console.error('Failed to emit real-time notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Create and send a notification for a budget action
   * @param {string} userId - User ID to notify
   * @param {string} action - Action performed (e.g., 'submitted', 'approved', 'rejected')
   * @param {Object} budget - Budget data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created notification
   */
  static async notifyBudgetAction(userId, action, budget, options = {}) {
    const actionTemplates = {
      submitted: {
        title: 'Budget Submitted for Approval',
        message: `Budget ${budget.code} (${budget.title}) has been submitted for approval.`,
        type: 'info',
      },
      approved: {
        title: 'Budget Approved',
        message: `Budget ${budget.code} (${budget.title}) has been approved.`,
        type: 'success',
      },
      rejected: {
        title: 'Budget Rejected',
        message: `Budget ${budget.code} (${budget.title}) has been rejected.`,
        type: 'error',
      },
      comment: {
        title: 'New Comment on Budget',
        message: `New comment on budget ${budget.code} (${budget.title}): ${options.comment}`,
        type: 'info',
      },
      default: {
        title: 'Budget Update',
        message: `Budget ${budget.code} (${budget.title}) has been updated.`,
        type: 'info',
      },
    };

    const template = actionTemplates[action] || actionTemplates.default;

    return this.createNotification({
      userId,
      title: template.title,
      message: template.message,
      type: template.type,
      referenceType: 'budget',
      referenceId: budget.id,
      metadata: {
        action,
        budgetId: budget.id,
        budgetCode: budget.code,
        budgetTitle: budget.title,
        ...options.metadata,
      },
      sendEmail: options.sendEmail !== false, // Default to true unless explicitly set to false
    });
  }

  /**
   * Create and send a notification for an expenditure action
   * @param {string} userId - User ID to notify
   * @param {string} action - Action performed (e.g., 'submitted', 'approved', 'rejected')
   * @param {Object} expenditure - Expenditure data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created notification
   */
  static async notifyExpenditureAction(userId, action, expenditure, options = {}) {
    const actionTemplates = {
      submitted: {
        title: 'Expenditure Submitted for Approval',
        message: `Expenditure ${expenditure.referenceNumber} has been submitted for approval.`,
        type: 'info',
      },
      approved: {
        title: 'Expenditure Approved',
        message: `Expenditure ${expenditure.referenceNumber} has been approved.`,
        type: 'success',
      },
      rejected: {
        title: 'Expenditure Rejected',
        message: `Expenditure ${expenditure.referenceNumber} has been rejected.`,
        type: 'error',
      },
      comment: {
        title: 'New Comment on Expenditure',
        message: `New comment on expenditure ${expenditure.referenceNumber}: ${options.comment}`,
        type: 'info',
      },
      default: {
        title: 'Expenditure Update',
        message: `Expenditure ${expenditure.referenceNumber} has been updated.`,
        type: 'info',
      },
    };

    const template = actionTemplates[action] || actionTemplates.default;

    return this.createNotification({
      userId,
      title: template.title,
      message: template.message,
      type: template.type,
      referenceType: 'expenditure',
      referenceId: expenditure.id,
      metadata: {
        action,
        expenditureId: expenditure.id,
        referenceNumber: expenditure.referenceNumber,
        amount: expenditure.amount,
        ...options.metadata,
      },
      sendEmail: options.sendEmail !== false, // Default to true unless explicitly set to false
    });
  }

  /**
   * Notify approvers when expenditure is submitted
   * @param {Object} expenditure - Expenditure data
   * @returns {Promise<void>}
   */
  static async notifyExpenditureSubmitted(expenditure) {
    try {
      // Get approvers for the MDA
      const approvers = await db.User.findAll({
        where: {
          mdaId: expenditure.mdaId,
          role: { [Op.in]: ['admin', 'budget_approver', 'director'] },
        },
      });

      for (const approver of approvers) {
        await this.notifyExpenditureAction(approver.id, 'submitted', expenditure);
      }
    } catch (error) {
      console.error('Error notifying expenditure submitted:', error);
    }
  }

  /**
   * Notify creator when expenditure is approved
   * @param {Object} expenditure - Expenditure data
   * @returns {Promise<void>}
   */
  static async notifyExpenditureApproved(expenditure) {
    try {
      await this.notifyExpenditureAction(expenditure.createdBy, 'approved', expenditure);
    } catch (error) {
      console.error('Error notifying expenditure approved:', error);
    }
  }

  /**
   * Notify creator when expenditure is rejected
   * @param {Object} expenditure - Expenditure data
   * @returns {Promise<void>}
   */
  static async notifyExpenditureRejected(expenditure) {
    try {
      await this.notifyExpenditureAction(expenditure.createdBy, 'rejected', expenditure, {
        metadata: { rejectionReason: expenditure.rejectionReason },
      });
    } catch (error) {
      console.error('Error notifying expenditure rejected:', error);
    }
  }

  /**
   * Notify stakeholders of budget warning
   * @param {Object} lineItem - Budget line item
   * @param {Object} warningStatus - Warning status details
   * @param {Array} stakeholders - List of stakeholders to notify
   * @returns {Promise<void>}
   */
  static async notifyBudgetWarning(lineItem, warningStatus, stakeholders) {
    try {
      const warningLevels = {
        medium: { emoji: '⚠️', color: 'yellow' },
        high: { emoji: '🔶', color: 'orange' },
        critical: { emoji: '🚨', color: 'red' },
      };

      const level = warningLevels[warningStatus.level] || warningLevels.medium;

      for (const stakeholder of stakeholders) {
        await this.createNotification({
          userId: stakeholder.id,
          title: `${level.emoji} Budget Warning: ${warningStatus.threshold}% Utilization`,
          message: `Budget line item "${lineItem.name}" (${lineItem.code}) has reached ${warningStatus.threshold}% utilization.`,
          type: 'warning',
          referenceType: 'budget_line_item',
          referenceId: lineItem.id,
          metadata: {
            lineItemId: lineItem.id,
            lineItemCode: lineItem.code,
            lineItemName: lineItem.name,
            threshold: warningStatus.threshold,
            level: warningStatus.level,
            amount: lineItem.amount,
            balance: lineItem.balance,
          },
          sendEmail: true,
        });
      }
    } catch (error) {
      console.error('Error notifying budget warning:', error);
    }
  }

  /**
   * Notify reviewers when retirement is submitted
   * @param {Object} retirement - Retirement data
   * @returns {Promise<void>}
   */
  static async notifyRetirementSubmitted(retirement) {
    try {
      const expenditure = await db.Expenditure.findByPk(retirement.expenditureId);
      if (!expenditure) return;

      // Get reviewers for the MDA
      const reviewers = await db.User.findAll({
        where: {
          mdaId: expenditure.mdaId,
          role: { [Op.in]: ['admin', 'budget_reviewer', 'director'] },
        },
      });

      for (const reviewer of reviewers) {
        await this.createNotification({
          userId: reviewer.id,
          title: 'Retirement Submitted for Review',
          message: `Retirement ${retirement.retirementNumber} has been submitted for review.`,
          type: 'info',
          referenceType: 'retirement',
          referenceId: retirement.id,
          metadata: {
            retirementId: retirement.id,
            retirementNumber: retirement.retirementNumber,
            amountRetired: retirement.amountRetired,
          },
          sendEmail: true,
        });
      }
    } catch (error) {
      console.error('Error notifying retirement submitted:', error);
    }
  }

  /**
   * Notify creator when retirement is approved
   * @param {Object} retirement - Retirement data
   * @returns {Promise<void>}
   */
  static async notifyRetirementApproved(retirement) {
    try {
      await this.createNotification({
        userId: retirement.createdBy,
        title: 'Retirement Approved',
        message: `Retirement ${retirement.retirementNumber} has been approved.`,
        type: 'success',
        referenceType: 'retirement',
        referenceId: retirement.id,
        metadata: {
          retirementId: retirement.id,
          retirementNumber: retirement.retirementNumber,
          amountRetired: retirement.amountRetired,
        },
        sendEmail: true,
      });
    } catch (error) {
      console.error('Error notifying retirement approved:', error);
    }
  }
}

const notificationService = new NotificationService();

module.exports = notificationService;
