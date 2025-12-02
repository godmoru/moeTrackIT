'use strict';

const express = require('express');

const router = express.Router();

router.use('/lgas', require('./lgas')); // /api/lgas
router.use('/entities', require('./entities')); // /api/entities
router.use('/income-sources', require('./incomeSources')); // /api/income-sources
router.use('/assessments', require('./assessments')); // /api/assessments

module.exports = router;
