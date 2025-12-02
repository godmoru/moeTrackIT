"use strict";

const express = require("express");
const assessmentController = require("../controllers/assessmentController");

const router = express.Router();

router.get("/", assessmentController.listAssessments);
router.post("/", assessmentController.createAssessment);
router.post("/bulk-annual-license", assessmentController.bulkAnnualLicense);

module.exports = router;
