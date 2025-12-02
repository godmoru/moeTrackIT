'use strict';

const express = require('express');
const entityController = require('../controllers/entityController');

const router = express.Router();

router.get('/', entityController.listEntities);
router.get('/:id', entityController.getEntityById);
router.post('/', entityController.createEntity);

module.exports = router;
