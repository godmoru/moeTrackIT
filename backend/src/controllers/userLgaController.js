'use strict';

const { UserLga, User, Lga } = require('../../models');

/**
 * List all LGA assignments for a specific user
 */
async function listUserLgas(req, res) {
  try {
    const { userId } = req.params;
    const includeHistory = String(req.query.includeHistory || '').toLowerCase() === 'true' ||
      String(req.query.includeHistory || '') === '1';

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const where = { userId };
    if (!includeHistory) {
      where.isCurrent = true;
    }

    const assignments = await UserLga.findAll({
      where,
      include: [
        { model: Lga, as: 'lga', attributes: ['id', 'name', 'code', 'state'] },
        { model: User, as: 'assigner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'remover', attributes: ['id', 'name', 'email'] },
      ],
      order: [['assignedAt', 'DESC']],
    });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list user LGA assignments' });
  }
}

/**
 * Assign an LGA to a user (typically an AEO)
 */
async function assignLga(req, res) {
  try {
    const { userId } = req.params;
    const { lgaId } = req.body;

    if (!lgaId) {
      return res.status(400).json({ message: 'lgaId is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const lga = await Lga.findByPk(lgaId);
    if (!lga) {
      return res.status(404).json({ message: 'LGA not found' });
    }

    // Check if already assigned (current)
    const existing = await UserLga.findOne({
      where: { userId, lgaId, isCurrent: true },
    });
    if (existing) {
      return res.status(409).json({ message: 'User is already assigned to this LGA' });
    }

    const assignment = await UserLga.create({
      userId,
      lgaId,
      assignedAt: new Date(),
      assignedBy: req.user?.id || null,
      isCurrent: true,
      removedAt: null,
      removedBy: null,
    });

    // Reload with associations
    const result = await UserLga.findByPk(assignment.id, {
      include: [
        { model: Lga, as: 'lga', attributes: ['id', 'name', 'code', 'state'] },
        { model: User, as: 'assigner', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign LGA to user' });
  }
}

/**
 * Remove an LGA assignment from a user
 */
async function unassignLga(req, res) {
  try {
    const { userId, lgaId } = req.params;

    const assignment = await UserLga.findOne({
      where: { userId, lgaId, isCurrent: true },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.isCurrent = false;
    assignment.removedAt = new Date();
    assignment.removedBy = req.user?.id || null;
    await assignment.save();

    res.json({ message: 'LGA assignment removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove LGA assignment' });
  }
}

/**
 * Replace all LGA assignments for a user (bulk update)
 */
async function setUserLgas(req, res) {
  try {
    const { userId } = req.params;
    const { lgaIds } = req.body;

    if (!Array.isArray(lgaIds)) {
      return res.status(400).json({ message: 'lgaIds must be an array' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate all LGA IDs exist
    if (lgaIds.length > 0) {
      const lgas = await Lga.findAll({ where: { id: lgaIds } });
      if (lgas.length !== lgaIds.length) {
        return res.status(400).json({ message: 'One or more LGA IDs are invalid' });
      }
    }

    const now = new Date();

    await UserLga.update(
      {
        isCurrent: false,
        removedAt: now,
        removedBy: req.user?.id || null,
      },
      { where: { userId, isCurrent: true } },
    );

    // Create new assignments
    const assignments = lgaIds.map((lgaId) => ({
      userId,
      lgaId,
      assignedAt: now,
      assignedBy: req.user?.id || null,
      isCurrent: true,
      removedAt: null,
      removedBy: null,
      createdAt: now,
      updatedAt: now,
    }));

    if (assignments.length > 0) {
      await UserLga.bulkCreate(assignments);
    }

    // Return updated assignments
    const result = await UserLga.findAll({
      where: { userId, isCurrent: true },
      include: [
        { model: Lga, as: 'lga', attributes: ['id', 'name', 'code', 'state'] },
      ],
      order: [['assignedAt', 'DESC']],
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user LGA assignments' });
  }
}

module.exports = {
  listUserLgas,
  assignLga,
  unassignLga,
  setUserLgas,
};
