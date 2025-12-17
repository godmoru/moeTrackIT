'use strict';

const { AuditLog, User } = require('../../models');
const { Op } = require('sequelize');

/**
 * GET /api/v1/audit-logs
 * List audit logs with filtering and pagination (super_admin only)
 */
async function listAuditLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      startDate,
      endDate,
      search,
    } = req.query;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      where[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { userEmail: { [Op.iLike]: `%${search}%` } },
        { path: { [Op.iLike]: `%${search}%` } },
        { action: { [Op.iLike]: `%${search}%` } },
        { resource: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
    });

    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Failed to list audit logs:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
}

/**
 * GET /api/v1/audit-logs/stats
 * Get audit log statistics
 */
async function getAuditStats(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Get counts by action
    const actionCounts = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count'],
      ],
      group: ['action'],
      raw: true,
    });

    // Get counts by resource
    const resourceCounts = await AuditLog.findAll({
      where,
      attributes: [
        'resource',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count'],
      ],
      group: ['resource'],
      raw: true,
    });

    // Get most active users
    const activeUsers = await AuditLog.findAll({
      where: { ...where, userId: { [Op.ne]: null } },
      attributes: [
        'userId',
        'userName',
        'userEmail',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count'],
      ],
      group: ['userId', 'userName', 'userEmail'],
      order: [[AuditLog.sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get total count
    const totalCount = await AuditLog.count({ where });

    res.json({
      totalCount,
      actionCounts,
      resourceCounts,
      activeUsers,
    });
  } catch (err) {
    console.error('Failed to get audit stats:', err);
    res.status(500).json({ message: 'Failed to fetch audit statistics' });
  }
}

/**
 * GET /api/v1/audit-logs/:id
 * Get single audit log details
 */
async function getAuditLogById(req, res) {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
    });

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (err) {
    console.error('Failed to get audit log:', err);
    res.status(500).json({ message: 'Failed to fetch audit log' });
  }
}

module.exports = {
  listAuditLogs,
  getAuditStats,
  getAuditLogById,
};
