"use strict";

const express = require("express");
const reportController = require("../controllers/reportController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.summary,
);

router.get(
  "/entities.xlsx",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportEntitiesExcel,
);

router.get(
  "/payments.xlsx",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportPaymentsExcel,
);

router.get(
  "/entities/:id/assessments.csv",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportEntityAssessmentsCsv,
);

router.get(
  "/entities/:id/payments.csv",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportEntityPaymentsCsv,
);

router.get(
  "/entities/:id/summary.pdf",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportEntitySummaryPdf,
);

module.exports = router;
