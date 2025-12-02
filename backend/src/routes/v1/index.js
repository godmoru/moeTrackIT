'use strict';

const express = require('express');

const router = express.Router();

router.use('/auth', require('../auth'));
router.use('/users', require('../users'));
router.use('/roles', require('../roles'));
router.use('/permissions', require('../permissions'));
router.use('/lgas', require('../lgas'));
router.use('/entities', require('../entities'));
router.use('/income-sources', require('../incomeSources'));
router.use('/assessments', require('../assessments'));
router.use('/payments', require('../payments'));
router.use('/reports', require('../reports'));
router.use('/entity-types', require('../entityTypes'));
router.use('/entity-ownerships', require('../entityOwnership'));
router.use('/settings', require('../settings'));


module.exports = router;
