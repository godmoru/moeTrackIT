'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// List users (super_admin and admin) with users.view permission
router.get(
  '/',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  requirePermission('users.view'),
  userController.listUsers,
);

// Admin-only create user (super_admin with users.manage)
router.post(
  '/',
  authMiddleware,
  requireRole('super_admin'),
  requirePermission('users.manage'),
  userController.createUser,
);

// Admin-only update user role/status (super_admin with users.manage)
router.put(
  '/:id',
  authMiddleware,
  requireRole('super_admin'),
  requirePermission('users.manage'),
  userController.updateUser,
);

module.exports = router;
