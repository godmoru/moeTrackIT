"use strict";

const express = require("express");
const assessmentController = require("../controllers/assessmentController");
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All roles can list assessments (scope filtering applied in controller)
router.get("/", authMiddleware, assessmentController.listAssessments);
// Only super_admin and officer can create assessments
router.post("/", authMiddleware, requireRole('super_admin', 'officer', 'hq_cashier'), assessmentController.createAssessment);
router.post("/bulk-annual-license", authMiddleware, requireRole('super_admin', 'officer','hq_cashier'), assessmentController.bulkAnnualLicense);

module.exports = router;
