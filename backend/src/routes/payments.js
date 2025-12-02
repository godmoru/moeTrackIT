'use strict';

const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('super_admin', 'officer'), paymentController.listPayments);
router.post('/', authMiddleware, requireRole('super_admin', 'officer'), paymentController.createPayment);
router.get('/:id/invoice.pdf', authMiddleware, requireRole('super_admin', 'officer'), paymentController.paymentInvoice);

module.exports = router;
