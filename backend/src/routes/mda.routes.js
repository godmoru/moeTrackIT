import express from 'express';
import { body, param, query } from 'express-validator';
import * as mdaController from '../../controllers/v1/mdaController.js';
import * as authMiddleware from '../../middleware/v1/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

// Get MDA hierarchy (accessible by all authenticated users)
router.get('/hierarchy', mdaController.getMdaHierarchy);

// Get MDA statistics (admin only)
router.get('/statistics', authMiddleware.restrictTo('admin'), mdaController.getMdaStatistics);

// Get all MDAs with filtering and pagination
router.get(
  '/',
  [
    query('search').optional().trim(),
    query('type').optional().isIn(['ministry', 'department', 'agency']),
    query('isActive').optional().isIn(['true', 'false']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  mdaController.getAllMdas
);

// Create new MDA (admin only)
router.post(
  '/',
  authMiddleware.restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Code is required')
      .isUppercase()
      .withMessage('Code must be uppercase')
      .isLength({ min: 2, max: 10 })
      .withMessage('Code must be between 2 and 10 characters'),
    body('type')
      .isIn(['ministry', 'department', 'agency'])
      .withMessage('Invalid MDA type'),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().trim(),
    body('website').optional().isURL().withMessage('Please provide a valid URL'),
    body('parentId')
      .optional()
      .isUUID()
      .withMessage('Invalid parent MDA ID'),
  ],
  mdaController.createMda
);

// Get single MDA
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid MDA ID')
  ],
  mdaController.getMda
);

// Update MDA
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid MDA ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('code')
      .optional()
      .trim()
      .isUppercase()
      .withMessage('Code must be uppercase')
      .isLength({ min: 2, max: 10 })
      .withMessage('Code must be between 2 and 10 characters'),
    body('type')
      .optional()
      .isIn(['ministry', 'department', 'agency'])
      .withMessage('Invalid MDA type'),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('phone').optional().trim(),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('parentId')
      .optional()
      .isUUID()
      .withMessage('Invalid parent MDA ID'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  mdaController.updateMda
);

// Delete MDA (admin only)
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  [param('id').isUUID().withMessage('Invalid MDA ID')],
  mdaController.deleteMda
);

// Export the router
export default router;
