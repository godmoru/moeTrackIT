'use strict';

const express = require('express');
const { listPermissions, createPermission } = require('../controllers/permissionController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Permissions catalog is visible to super_admin for now
router.get('/', authMiddleware, requireRole('super_admin'), listPermissions);
router.post('/', authMiddleware, requireRole('super_admin'), createPermission);

module.exports = router;
