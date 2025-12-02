'use strict';

const express = require('express');
const incomeSourceController = require('../controllers/incomeSourceController');

const router = express.Router();

router.get('/', incomeSourceController.listIncomeSources);
router.post('/', incomeSourceController.createIncomeSource);

module.exports = router;
