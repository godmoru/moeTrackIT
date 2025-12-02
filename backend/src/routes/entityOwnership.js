'use strict';

const express = require('express');
const entityController = require('../controllers/entityController');

const router = express.Router();

router.get('/', entityController.getEntityOwnership);

module.exports = router;
