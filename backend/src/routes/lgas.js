'use strict';

const express = require('express');
const lgaController = require('../controllers/lgaController');

const router = express.Router();

router.get('/', lgaController.listLGAs);

module.exports = router;
