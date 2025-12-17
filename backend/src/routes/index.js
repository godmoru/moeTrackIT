'use strict';

const express = require('express');

const router = express.Router();

router.use('/lgas', require('./lgas')); // /api/lgas
router.use('/institutions', require('./entities')); // /api/institutions
router.use('/institution-types', require('./entities/')); // /api/institution-type
router.use('/institution-ownership', require('./entities/')); // /api/institution-ownereship
router.use('/income-sources', require('./incomeSources')); // /api/income-sources
router.use('/assessments', require('./assessments')); // /api/assessments

module.exports = router;
