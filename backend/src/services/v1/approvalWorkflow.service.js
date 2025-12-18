import { Op } from 'sequelize';
import AppError from '../../utils/appError.js';
import db from '../../models/v1/index.js';

class ApprovalWorkflowService {
  /**
   * Submit a budget for approval
   * @param {string} budgetId - Budget ID
   * @param {string} userId - ID of the user submitting for approval
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated budget and  approval record
   */
  static async submitForApproval(budgetId, userId, options = {}) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const budget = await db.Budget.findByPk(budgetId, { transaction });
      
      if (!budget) {
        throw new AppError('Budget not found', 404);
      }

      // Check if budget is already in approval process
      if (budget.status === 'pending_approval') {
        throw new AppError('Budget is already in approval process', 400);
      }

      if (budget.status === 'approved') {
        throw new AppError('Budget is already approved', 400);
      }

      // Determine approvers based on budget amount and type
      const approvers = await this.determineApprovers(budget, userId, transaction);
      
      if (approvers.length === 0) {
        throw new AppError('No approvers found for this budget', 400);
      }

      // Update budget status
      await budget.update(
        {
          status: 'pending_approval',
          submittedAt: new Date(),
          submittedBy: userId,
          currentApproverId: approvers[0].id, // First approver in the chain
        },
        { transaction }
      );

      // Create approval history record
      const approval = await db.ApprovalHistory.create(
        {
          entityType: 'budget',
          entityId: budgetId,
          action: 'submitted',
          status: 'pending',
          userId: approvers[0].id, // Current approver
          comments: options.comments,
          metadata: {
            approvers: approvers.map(a => ({
              id: a.id,
              name: `${a.firstName} ${a.lastName}`,
              role: a.role,
              order: a.order,
            })),
          },
        },
        { transaction }
      );

      await transaction.commit();
      
      // Notify the first approver (you'll implement notification logic)
      await this.notifyApprover(approvers[0], budget, 'pending_approval');
      
      return { budget, approval };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Approve a budget or expenditure
   * @param {string} entityType - Type of entity ('budget' or 'expenditure')
   * @param {string} entityId - ID of the entity
   * @param {string} userId - ID of the user approving
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated entity and approval record
   */
  static async approve(entityType, entityId, userId, options = {}) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Validate entity type
      if (!['budget', 'expenditure'].includes(entityType)) {
        throw new AppError('Invalid entity type', 400);
      }

      // Find the entity
      const entity = await db[entityType.charAt(0).toUpperCase() + entityType.slice(1)].findByPk(entityId, {
        transaction,
      });

      if (!entity) {
        throw new AppError(`${entityType} not found`, 404);
      }

      // Check if the user is the current approver
      if (entity.currentApproverId !== userId) {
        throw new AppError('You are not authorized to approve this request', 403);
      }

      // Get approval history for this entity
      const approvalHistory = await db.ApprovalHistory.findAll({
        where: {
          entityType,
          entityId,
        },
        order: [['createdAt', 'DESC']],
        transaction,
      });

      // Get all approvers from the first approval record
      let approvers = [];
      if (approvalHistory.length > 0) {
        approvers = approvalHistory[0].metadata?.approvers || [];
      }

      // Find the current approver's position
      const currentApproverIndex = approvers.findIndex(a => a.id === userId);
      const isLastApprover = currentApproverIndex === approvers.length - 1;

      // Update the current approval record
      const currentApproval = await db.ApprovalHistory.create(
        {
          entityType,
          entityId,
          action: 'approved',
          status: 'approved',
          userId,
          comments: options.comments,
          metadata: {
            ...(approvalHistory[0]?.metadata || {}),
            currentApproverIndex,
          },
        },
        { transaction }
      );

      // If this is the last approver, update the entity status
      if (isLastApprover) {
        await entity.update(
          {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: userId,
            currentApproverId: null,
          },
          { transaction }
        );

        // Notify relevant users of approval
        await this.notifyApprovalComplete(entity, 'approved');
      } else {
        // Assign to the next approver
        const nextApprover = approvers[currentApproverIndex + 1];
        await entity.update(
          {
            currentApproverId: nextApprover.id,
          },
          { transaction }
        );

        // Notify the next approver
        await this.notifyApprover(
          nextApprover,
          entity,
          'pending_approval',
          currentApproverIndex + 1
        );
      }

      await transaction.commit();
      return { [entityType]: entity, approval: currentApproval };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reject a budget or expenditure
   * @param {string} entityType - Type of entity ('budget' or 'expenditure')
   * @param {string} entityId - ID of the entity
   * @param {string} userId - ID of the user rejecting
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated entity and rejection record
   */
  static async reject(entityType, entityId, userId, options = {}) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Validate entity type
      if (!['budget', 'expenditure'].includes(entityType)) {
        throw new AppError('Invalid entity type', 400);
      }

      // Find the entity
      const entity = await db[entityType.charAt(0).toUpperCase() + entityType.slice(1)].findByPk(entityId, {
        transaction,
      });

      if (!entity) {
        throw new AppError(`${entityType} not found`, 404);
      }

      // Check if the user is the current approver or an admin
      if (entity.currentApproverId !== userId && !options.isAdmin) {
        throw new AppError('You are not authorized to reject this request', 403);
      }

      // Create rejection record
      const rejection = await db.ApprovalHistory.create(
        {
          entityType,
          entityId,
          action: 'rejected',
          status: 'rejected',
          userId,
          comments: options.comments,
          metadata: {
            rejectionReason: options.rejectionReason,
          },
        },
        { transaction }
      );

      // Update entity status
      await entity.update(
        {
          status: 'rejected',
          rejectionReason: options.rejectionReason,
          rejectedAt: new Date(),
          rejectedBy: userId,
          currentApproverId: null,
        },
        { transaction }
      );

      // Notify relevant users of rejection
      await this.notifyRejection(entity, options.rejectionReason, options.comments);

      await transaction.commit();
      return { [entityType]: entity, rejection };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get approval history for an entity
   * @param {string} entityType - Type of entity ('budget' or 'expenditure')
   * @param {string} entityId - ID of the entity
   * @returns {Promise<Array>} List of approval history records
   */
  static async getApprovalHistory(entityType, entityId) {
    const history = await db.ApprovalHistory.findAll({
      where: {
        entityType,
        entityId,
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return history;
  }

  /**
   * Determine approvers for a budget based on amount and type
   * @private
   */
  static async determineApprovers(budget, userId, transaction) {
    // This is a simplified example - you would typically have more complex logic here
    // based on your organization's approval hierarchy
    
    // Get the user who submitted the budget
    const submitter = await db.User.findByPk(userId, {
      attributes: ['id', 'mdaId', 'role'],
      transaction,
    });

    if (!submitter) {
      throw new AppError('User not found', 404);
    }

    // For demonstration, we'll use a simple role-based approval flow
    // In a real app, this would be more sophisticated
    const approvers = [];
    
    // First approver: Director of the MDA
    const director = await db.User.findOne({
      where: {
        mdaId: submitter.mdaId,
        role: 'director',
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      transaction,
    });

    if (director) {
      approvers.push({ ...director.get({ plain: true }), order: 1 });
    }

    // Second approver: Permanent Secretary (if amount is above threshold)
    if (budget.totalAmount > 1000000) { // Example threshold
      const permSec = await db.User.findOne({
        where: {
          role: 'permanent_secretary',
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        transaction,
      });

      if (permSec) {
        approvers.push({ ...permSec.get({ plain: true }), order: 2 });
      }
    }

    // Final approver: Commissioner (if amount is very high)
    if (budget.totalAmount > 5000000) { // Higher threshold
      const commissioner = await db.User.findOne({
        where: {
          role: 'commissioner',
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        transaction,
      });

      if (commissioner) {
        approvers.push({ ...commissioner.get({ plain: true }), order: 3 });
      }
    }

    return approvers.sort((a, b) => a.order - b.order);
  }

  /**
   * Notify an approver about a pending approval
   * @private
   */
  static async notifyApprover(approver, entity, status, step = 1, totalSteps = null) {
    // This is a placeholder for your notification logic
    // In a real app, you would send an email, in-app notification, etc.
    console.log(`Notifying ${approver.email} about pending ${entity.constructor.name} approval (${status})`);
    
    // Example: Create a notification record in the database
    await db.Notification.create({
      userId: approver.id,
      title: `Approval Request - ${entity.constructor.name} #${entity.id}`,
      message: `You have a pending ${entity.constructor.name} to approve (${step} of ${totalSteps || '?'})`,
      type: 'approval_request',
      referenceType: entity.constructor.name.toLowerCase(),
      referenceId: entity.id,
      metadata: {
        status,
        step,
        totalSteps,
      },
    });
    
    // Here you would also send an email or push notification
  }

  /**
   * Notify about approval completion
   * @private
   */
  static async notifyApprovalComplete(entity, status) {
    // Notify the original submitter and other stakeholders
    const submitter = await db.User.findByPk(entity.submittedBy);
    
    if (submitter) {
      await db.Notification.create({
        userId: submitter.id,
        title: `${entity.constructor.name} Approved`,
        message: `Your ${entity.constructor.name} #${entity.id} has been approved`,
        type: 'approval_complete',
        referenceType: entity.constructor.name.toLowerCase(),
        referenceId: entity.id,
        metadata: {
          status,
          approvedAt: new Date(),
          approvedBy: entity.approvedBy,
        },
      });
    }
    
    // Here you would also send emails to other stakeholders
  }

  /**
   * Notify about rejection
   * @private
   */
  static async notifyRejection(entity, reason, comments = '') {
    const submitter = await db.User.findByPk(entity.submittedBy);
    
    if (submitter) {
      await db.Notification.create({
        userId: submitter.id,
        title: `${entity.constructor.name} Rejected`,
        message: `Your ${entity.constructor.name} #${entity.id} has been rejected: ${reason}`,
        type: 'rejection',
        referenceType: entity.constructor.name.toLowerCase(),
        referenceId: entity.id,
        metadata: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: entity.rejectedBy,
          reason,
          comments,
        },
      });
    }
    
    // Here you would also send emails to other stakeholders
  }
}

export default ApprovalWorkflowService;
