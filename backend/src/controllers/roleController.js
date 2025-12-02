'use strict';

const { Role, Permission, RolePermission } = require('../../models');

async function listRoles(req, res) {
  try {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list roles' });
  }
}

async function createRole(req, res) {
  try {
    const { name, slug, description } = req.body || {};
    if (!name || !slug) {
      return res.status(400).json({ message: 'name and slug are required' });
    }

    const existing = await Role.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: 'Role with this slug already exists' });
    }

    const role = await Role.create({ name, slug, description, isSystem: false });
    res.status(201).json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create role' });
  }
}

async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body || {};

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;

    await role.save();
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update role' });
  }
}

async function updateRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body || {};

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds must be an array of IDs' });
    }

    // Replace existing mappings
    await RolePermission.destroy({ where: { roleId: role.id } });
    const now = new Date();

    if (permissionIds.length > 0) {
      await RolePermission.bulkCreate(
        permissionIds.map((pid) => ({
          roleId: role.id,
          permissionId: pid,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    const updated = await Role.findByPk(role.id, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update role permissions' });
  }
}

module.exports = {
  listRoles,
  createRole,
  updateRole,
  updateRolePermissions,
};
