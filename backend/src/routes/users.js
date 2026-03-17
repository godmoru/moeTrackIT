'use strict';

const express = require('express');
const multer = require('multer');
const userController = require('../controllers/userController');
const userLgaController = require('../controllers/userLgaController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// List users - super_admin only
router.get(
  '/',
  authMiddleware,
  requireRole('super_admin'),
  userController.listUsers,
);

// Create user - super_admin only
router.post(
  '/',
  authMiddleware,
  requireRole('super_admin'),
  userController.createUser,
);

// Update user role/status - super_admin only
router.put(
  '/:id',
  authMiddleware,
  requireRole('super_admin'),
  userController.updateUser,
);

// Upload profile image - any authenticated user can upload their own image
// or super_admin can upload for any user
router.post(
  '/:id/profile-image',
  authMiddleware,
  (req, res, next) => {
    userController.uploadProfileImageMiddleware(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Max size is 5MB.' });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ message: err.message || 'Failed to upload file' });
      }
      next();
    });
  },
  userController.uploadProfileImage,
);

// --- AEO-LGA Assignment Management ---

// List LGA assignments for a user
router.get(
  '/:userId/lgas',
  authMiddleware,
  requireRole('super_admin'),
  userLgaController.listUserLgas,
);

// Assign an LGA to a user
router.post(
  '/:userId/lgas',
  authMiddleware,
  requireRole('super_admin'),
  userLgaController.assignLga,
);

// Replace all LGA assignments for a user (bulk update)
router.put(
  '/:userId/lgas',
  authMiddleware,
  requireRole('super_admin'),
  userLgaController.setUserLgas,
);

// Remove an LGA assignment from a user
router.delete(
  '/:userId/lgas/:lgaId',
  authMiddleware,
  requireRole('super_admin'),
  userLgaController.unassignLga,
);

module.exports = router;
