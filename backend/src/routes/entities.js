'use strict';

const express = require('express');
const entityController = require('../controllers/entityController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All entity routes require auth for scope filtering
router.get('/', authMiddleware, entityController.listEntities);

// Export endpoints (authenticated) - define before '/:id' to avoid route conflicts
router.get('/export.csv', authMiddleware, entityController.exportEntitiesCsv);
router.get('/export.xlsx', authMiddleware, entityController.exportEntitiesExcel);
router.get('/export.pdf', authMiddleware, entityController.exportEntitiesPdf);

// Bulk import/export endpoints (super_admin and officer only)
router.get('/export-template', authMiddleware, requireRole('super_admin', 'officer'), entityController.downloadImportTemplate);
router.get('/export-for-update', authMiddleware, requireRole('super_admin', 'officer'), entityController.exportForBulkUpdate);
router.post('/bulk-import', authMiddleware, requireRole('super_admin', 'officer'), entityController.bulkImportEntities);

router.get('/:id', authMiddleware, entityController.getEntityById);
// Only super_admin, system_admin, officer, and principal can create/update entities
router.post('/', authMiddleware, requireRole('super_admin', 'officer', 'system_admin'), entityController.createEntity);
router.put('/:id', authMiddleware, requireRole('super_admin', 'officer', 'system_admin', 'principal'), entityController.updateEntity);

module.exports = router;
