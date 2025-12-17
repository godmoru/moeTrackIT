'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

const router = express.Router();

// All audit log routes require super_admin role
router.use(authMiddleware);
router.use(requireRole('super_admin'));

router.get('/', auditController.listAuditLogs);
router.get('/stats', auditController.getAuditStats);
router.get('/:id', auditController.getAuditLogById);

module.exports = router;
