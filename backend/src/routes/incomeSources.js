'use strict';

const express = require('express');
const incomeSourceController = require('../controllers/incomeSourceController');

const router = express.Router();

router.get('/', incomeSourceController.listIncomeSources);
router.post('/', incomeSourceController.createIncomeSource);
router.get('/:id', incomeSourceController.getIncomeSourceById);
router.put('/:id', incomeSourceController.updateIncomeSource);

module.exports = router;
