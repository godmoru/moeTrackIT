'use strict';

const { Permission } = require('../../models');

async function listPermissions(req, res) {
  try {
    const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['code', 'ASC']] });
    res.json(permissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list permissions' });
  }
}

async function createPermission(req, res) {
  try {
    const { name, code, module, description } = req.body || {};

    if (!name || !code) {
      return res.status(400).json({ message: 'name and code are required' });
    }

    const existing = await Permission.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({ message: 'Permission with this code already exists' });
    }

    const permission = await Permission.create({ name, code, module, description });
    res.status(201).json(permission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create permission' });
  }
}

module.exports = {
  listPermissions,
  createPermission,
};
