'use strict';

const bcrypt = require('bcryptjs');
const db = require('../../models');
const { User, Role, UserRole, UserLga, Lga, sequelize } = db;

async function createUser(req, res) {
  try {
    const { name, email, password, role = 'officer', status = 'active', lgaId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    if (role === 'area_education_officer' && !lgaId) {
      return res.status(400).json({ message: 'lgaId is required for area_education_officer role' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await sequelize.transaction(async (t) => {
      const createdUser = await User.create(
        {
          name,
          email,
          passwordHash,
          role,
          status,
        },
        { transaction: t },
      );

      // Keep UserRoles in sync with the primary role string
      try {
        const roleRecord = await Role.findOne({ where: { slug: role }, transaction: t });
        if (roleRecord) {
          const now = new Date();
          await UserRole.create(
            {
              userId: createdUser.id,
              roleId: roleRecord.id,
              createdAt: now,
              updatedAt: now,
            },
            { transaction: t },
          );
        }
      } catch (syncErr) {
        console.error('Failed to sync UserRoles on createUser:', syncErr);
        // Do not fail the request if RBAC sync fails
      }

      // Auto-assign AEO to an LGA at creation time
      if (role === 'area_education_officer') {
        const lga = await Lga.findByPk(lgaId, { transaction: t });
        if (!lga) {
          const err = new Error('LGA not found');
          // @ts-ignore
          err.status = 404;
          throw err;
        }

        await UserLga.create(
          {
            userId: createdUser.id,
            lgaId,
            assignedAt: new Date(),
            assignedBy: req.user?.id || null,
            isCurrent: true,
            removedAt: null,
            removedBy: null,
          },
          { transaction: t },
        );
      }

      return createdUser;
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    const status = err?.status || 500;
    if (status !== 500) {
      return res.status(status).json({ message: err.message || 'Failed to create user' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

async function listUsers(req, res) {
  try {
    const { role, status, search } = req.query;

    const where = {};
    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }

    const { Op } = require('sequelize');
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      include: [
        {
          model: Lga,
          as: 'assignedLgas',
          attributes: ['id', 'name'],
          through: { attributes: [], where: { isCurrent: true } },
          required: false,
        },
      ],
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list users' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, status } = req.body || {};

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const originalRole = user.role;

    if (typeof role === 'string' && role.trim()) {
      user.role = role.trim();
    }
    if (typeof status === 'string' && status.trim()) {
      user.status = status.trim();
    }

    await user.save();

    // Sync UserRoles if primary role string changed
    if (typeof role === 'string' && role.trim() && role.trim() !== originalRole) {
      try {
        const newRoleSlug = role.trim();
        const roleRecord = await Role.findOne({ where: { slug: newRoleSlug } });
        if (roleRecord) {
          // Remove existing mappings and set the new primary role
          await UserRole.destroy({ where: { userId: user.id } });
          const now = new Date();
          await UserRole.create({
            userId: user.id,
            roleId: roleRecord.id,
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (syncErr) {
        console.error('Failed to sync UserRoles on updateUser:', syncErr);
        // Do not fail the request if RBAC sync fails
      }
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
}

module.exports = {
  createUser,
  updateUser,
  listUsers,
};
