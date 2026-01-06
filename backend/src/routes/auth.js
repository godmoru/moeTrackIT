'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public login
router.post('/login', authController.login);

// Authenticated logout (stateless)
router.post('/logout', authMiddleware, authController.logout);

// --- Password Reset Flow ---

// Public: Request password reset email (forgot password)
router.post('/forgot-password', authController.forgotPassword);

// Public: Verify if reset token is valid
router.get('/verify-reset-token', authController.verifyResetToken);

// Public: Reset password using token from email
router.post('/reset-password', authController.resetPasswordWithToken);

// Admin-only: Reset a user's password directly
router.post('/admin-reset-password', authMiddleware, requireRole('super_admin'), authController.adminResetPassword);

// Get current user details
router.get('/me', authMiddleware, authController.getMe);

// Authenticated user changes own password
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
