'use strict';

const express = require('express');
const incomeSourceController = require('../controllers/incomeSourceController');

const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

const READ_ROLES = ['super_admin', 'admin', 'system_admin', 'officer', 'area_education_officer', 'principal', 'hq_cashier'];
const ADMIN_ROLES = ['super_admin', 'admin', 'system_admin'];

router.get('/', authMiddleware, requireRole(...READ_ROLES), incomeSourceController.listIncomeSources);
router.post('/', authMiddleware, requireRole(...ADMIN_ROLES), incomeSourceController.createIncomeSource);
router.get('/:id', authMiddleware, requireRole(...READ_ROLES), incomeSourceController.getIncomeSourceById);
router.put('/:id', authMiddleware, requireRole(...ADMIN_ROLES), incomeSourceController.updateIncomeSource);

module.exports = router;
