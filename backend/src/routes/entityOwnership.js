'use strict';

const express = require('express');
const entityController = require('../controllers/entityController');
const entitieOwnershipControlleer = require('../controllers/entityOwershipController');

const router = express.Router();

router.get('/', entityController.getEntityOwnership);
router.post('/', entitieOwnershipControlleer.createOwnership)

module.exports = router;
