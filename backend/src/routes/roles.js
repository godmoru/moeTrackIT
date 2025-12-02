'use strict';

const express = require('express');
const { listRoles, createRole, updateRole, updateRolePermissions } = require('../controllers/roleController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All role management is super_admin-only for now
router.get('/', authMiddleware, requireRole('super_admin'), listRoles);
router.post('/', authMiddleware, requireRole('super_admin'), createRole);
router.put('/:id', authMiddleware, requireRole('super_admin'), updateRole);
router.put('/:id/permissions', authMiddleware, requireRole('super_admin'), updateRolePermissions);

module.exports = router;
