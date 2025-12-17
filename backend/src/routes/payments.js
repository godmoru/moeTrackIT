'use strict';

const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Paystack webhook (no auth required, uses signature verification)
router.post('/webhook', paymentController.paystackWebhook);

// All authenticated roles can list payments (scope filtering applied in controller)
router.get('/', authMiddleware, paymentController.listPayments);

// super_admin, officer, and area_education_officer can record manual payments
router.post('/', authMiddleware, requireRole('super_admin', 'officer', 'area_education_officer', 'hq_cashier'), paymentController.createPayment);

// Get assessments for current user's entity (for principals/AEOs to pay)
router.get('/my-assessments', authMiddleware, requireRole('principal', 'area_education_officer'), paymentController.getMyAssessments);

// Initialize online payment (for principals and AEOs)
router.post('/initialize', authMiddleware, requireRole('principal', 'area_education_officer', 'super_admin', 'officer', 'hq_cashier'), paymentController.initializeOnlinePayment);

// Verify payment after Paystack callback
router.get('/verify/:reference', authMiddleware, paymentController.verifyOnlinePayment);

// All authenticated roles can view invoices for payments they can see
router.get('/:id/invoice.pdf', authMiddleware, paymentController.paymentInvoice);

module.exports = router;
