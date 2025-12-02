'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// List users (super_admin and admin)
router.get('/', authMiddleware, requireRole('super_admin', 'admin'), userController.listUsers);

// Admin-only create user
router.post('/', authMiddleware, requireRole('super_admin'), userController.createUser);

// Admin-only update user role/status
router.put('/:id', authMiddleware, requireRole('super_admin'), userController.updateUser);

module.exports = router;
