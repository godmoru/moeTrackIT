"use strict";

const express = require("express");
const reportController = require("../controllers/reportController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

// Summary reports - all authenticated roles (principals see their entity, AEOs see their LGA)
router.get(
  "/summary",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "principal", "hq_cashier"),
  reportController.summary,
);

// LGA remittance reports - super_admin, officer, and AEO
router.get(
  "/remittance-by-lga",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "hq_cashier"),
  reportController.remittanceByLga,
);

router.get(
  "/remittance-by-lga.csv",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "hq_cashier"),
  reportController.exportRemittanceByLgaCsv,
);

router.get(
  "/remittance-by-lga.xlsx",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "hq_cashier"),
  reportController.exportRemittanceByLgaExcel,
);

router.get(
  "/remittance-by-lga.pdf",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "hq_cashier"),
  reportController.exportRemittanceByLgaPdf,
);

// Entity exports - super_admin and officer only
router.get(
  "/institutions.xlsx",
  authMiddleware,
  requireRole("super_admin", "officer"),
  reportController.exportEntitiesExcel,
);

router.get(
  "/payments.xlsx",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "hq_cashier"),
  reportController.exportPaymentsExcel,
);

// Per-entity reports - all authenticated roles (scope filtering applies)
router.get(
  "/institutions/:id/assessments.csv",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "principal", "hq_cashier"),
  reportController.exportEntityAssessmentsCsv,
);

router.get(
  "/institutions/:id/payments.csv",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "principal", "hq_cashier"),
  reportController.exportEntityPaymentsCsv,
);

router.get(
  "/institutions/:id/summary.pdf",
  authMiddleware,
  requireRole("super_admin", "officer", "area_education_officer", "principal", "hq_cashier"),
  reportController.exportEntitySummaryPdf,
);

module.exports = router;
