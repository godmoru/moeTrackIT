import express from 'express';
import { protect } from '../../middleware/v1/auth.middleware.js';
import { hasPermission, ROLES } from '../../middleware/v1/authorize.middleware.js';
import * as versionController from '../../controllers/v1/version.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   - name: Versions
 *     description: Budget version control
 */

// Get all versions of a budget
router.get(
  '/budgets/:id',
  hasPermission('budget:read'),
  versionController.getVersions
);

// Create a new version
router.post(
  '/budgets/:id',
  hasPermission('budget:update'),
  versionController.createVersion
);

// Get a specific version
router.get(
  '/budgets/:id/versions/:versionId',
  hasPermission('budget:read'),
  versionController.getVersion
);

// Restore a version
router.post(
  '/budgets/:id/versions/:versionId/restore',
  hasPermission('budget:update'),
  versionController.restoreVersion
);

// Export the router
export default router;
