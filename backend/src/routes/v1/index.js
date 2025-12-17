'use strict';

const express = require('express');

const router = express.Router();

router.use('/auth', require('../auth'));
router.use('/users', require('../users'));
router.use('/roles', require('../roles'));
router.use('/permissions', require('../permissions'));
router.use('/lgas', require('../lgas'));
router.use('/institutions', require('../entities')); //formerlly /entities 
router.use('/income-sources', require('../incomeSources'));
router.use('/assessments', require('../assessments'));
router.use('/payments', require('../payments'));
router.use('/reports', require('../reports'));
router.use('/institution-types', require('../entityTypes'));
router.use('/institution-ownerships', require('../entityOwnership'));
router.use('/settings', require('../settings'));
router.use('/audit-logs', require('../auditLogs'));

module.exports = router;
