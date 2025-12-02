'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin-only create user
router.post('/', authMiddleware, requireRole('super_admin'), userController.createUser);

module.exports = router;
