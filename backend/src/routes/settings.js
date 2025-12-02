'use strict';

const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authMiddleware, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Anyone authenticated can read settings; only super_admin with settings.manage can update.
router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, requireRole('super_admin'), requirePermission('settings.manage'), updateSettings);

module.exports = router;
