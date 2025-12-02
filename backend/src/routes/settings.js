'use strict';

const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Anyone authenticated can read settings; only super_admin can update.
router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, requireRole('super_admin'), updateSettings);

module.exports = router;
