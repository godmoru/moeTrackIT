import express from 'express';
import { body } from 'express-validator';
import authController from '../../controllers/v1/authController.js';
import authMiddleware from '../../middleware/v1/auth.middleware.js';

const router = express.Router();

// Authentication routes
router.post(authController.resetPassword);

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Update password for logged-in user
router.patch(
  '/updateMyPassword',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Please provide your current password'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('newPasswordConfirm')
      .exists({ checkFalsy: true })
      .withMessage('Please confirm your new password'),
  ],
  authController.updatePassword
);

// Update current user data (excluding password)
router.patch(
  '/updateMe',
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  ],
  authController.updateMe
);

// Deactivate current user account
router.delete('/deleteMe', authController.deleteMe);

export default router;
