'use strict';

const express = require('express');
const entityController = require('../controllers/entityController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', entityController.listEntities);

// Export endpoints (authenticated) - define before '/:id' to avoid route conflicts
router.get('/export.csv', authMiddleware, entityController.exportEntitiesCsv);
router.get('/export.xlsx', authMiddleware, entityController.exportEntitiesExcel);
router.get('/export.pdf', authMiddleware, entityController.exportEntitiesPdf);

router.get('/:id', entityController.getEntityById);
router.post('/', entityController.createEntity);

module.exports = router;
