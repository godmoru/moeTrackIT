'use strict';

const express = require('express');

const router = express.Router();

router.use('/lgas', require('./lgas')); // /api/lgas
router.use('/institutions', require('./entities')); // /api/institutions
router.use('/institution-types', require('./entities/')); // /api/institution-type
router.use('/institution-ownership', require('./entities/')); // /api/institution-ownereship
router.use('/income-sources', require('./incomeSources')); // /api/income-sources
router.use('/assessments', require('./assessments')); // /api/assessments

// Expenditure tracking routes
router.use('/line-items', require('./v1/budgetLineItem.routes')); // /api/v1/line-items
router.use('/expenditures', require('./v1/expenditure.routes')); // /api/v1/expenditures
router.use('/retirements', require('./v1/expenditureRetirement.routes')); // /api/v1/retirements
router.use('/attachments', require('./v1/attachment.routes')); // /api/v1/attachments
router.use('/dashboard', require('./v1/dashboard.routes')); // /api/v1/dashboard

module.exports = router;

