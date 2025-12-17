"use strict";

const { Assessment, Entity, IncomeSource, Payment, sequelize } = require("../../models");
const { createAssessmentWithCalculation } = require("../services/assessmentService");
const { getAssessmentScopeWhere } = require('../middleware/scope');

async function listAssessments(req, res) {
  try {
    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getAssessmentScopeWhere(req.user);

    // For AEO scope we need the entity include to filter by lgaId
    const assessments = await Assessment.findAll({
      where: scopeWhere,
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(assessments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
}

async function getAssessmentById(req, res) {
  try {
    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getAssessmentScopeWhere(req.user);

    // For AEO scope we need the entity include to filter by lgaId
    const assessment = await Assessment.findOne({
      where: scopeWhere,
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(assessment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch assessment' });
  }
}

async function createAssessment(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      entityId,
      incomeSourceId,
      parameterValues = {},
      currency = 'NGN',
      status = 'pending',
      dueDate,
      assessmentPeriod,
      createdBy,
    } = req.body;

    const assessment = await createAssessmentWithCalculation({
      entityId,
      incomeSourceId,
      parameterValues,
      currency,
      status,
      dueDate,
      assessmentPeriod,
      createdBy,
      transaction: t,
    });

    await t.commit();
    res.status(201).json(assessment);
  } catch (err) {
    console.error(err);
    await t.rollback();
    res.status(400).json({ message: err.message || 'Failed to create assessment' });
  }
}

/**
 * POST /api/v1/assessments/bulk-annual-license
 *
 * Body:
 * {
 *   incomeSourceId: number,
 *   assessmentPeriod: string,
 *   dueDate?: string,
 *   lgaNames?: string[],
 *   entityTypeIds?: number[],
 *   entityIds?: number[],       // Explicit list of entity IDs to assess
 *   onlyActive?: boolean
 * }
 */
async function bulkAnnualLicense(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      incomeSourceId,
      assessmentPeriod,
      dueDate = null,
      lgaNames,
      entityTypeIds,
      entityIds,
      onlyActive = true,
    } = req.body || {};

    if (!incomeSourceId || !assessmentPeriod) {
      return res.status(400).json({
        message: "incomeSourceId and assessmentPeriod are required",
      });
    }

    const where = {};

    // If explicit entityIds provided, use them directly (ignores other filters)
    if (Array.isArray(entityIds) && entityIds.length > 0) {
      where.id = entityIds;
    } else {
      // Otherwise apply filters
      if (onlyActive) {
        where.status = "active";
      }
      if (Array.isArray(entityTypeIds) && entityTypeIds.length > 0) {
        where.entityTypeId = entityTypeIds;
      }
      if (Array.isArray(lgaNames) && lgaNames.length > 0) {
        where.lga = lgaNames;
      }
    }

    const entities = await Entity.findAll({ where, transaction: t });

    if (!entities.length) {
      await t.rollback();
      return res.status(200).json({
        createdCount: 0,
        skippedCount: 0,
        message: "No eligible entities found for bulk assessment",
      });
    }

    const foundEntityIds = entities.map((e) => e.id);

    const existingAssessments = await Assessment.findAll({
      where: {
        entityId: foundEntityIds,
        incomeSourceId,
        assessmentPeriod,
      },
      transaction: t,
    });

    const alreadyAssessedEntityIds = new Set(
      existingAssessments.map((a) => a.entityId),
    );

    const created = [];
    const skipped = [];

    for (const entity of entities) {
      if (alreadyAssessedEntityIds.has(entity.id)) {
        skipped.push({
          entityId: entity.id,
          reason: "Already has assessment for this income source and period",
        });
        continue;
      }

      const assessment = await createAssessmentWithCalculation({
        entityId: entity.id,
        incomeSourceId,
        parameterValues: {},
        status: "pending",
        dueDate,
        assessmentPeriod,
        createdBy: req.user?.id || null,
        transaction: t,
      });

      created.push(assessment);
    }

    await t.commit();

    return res.status(201).json({
      createdCount: created.length,
      skippedCount: skipped.length,
      createdEntityIds: created.map((a) => a.entityId),
      skipped,
    });
  } catch (err) {
    console.error(err);
    await t.rollback();
    return res.status(500).json({
      message: "Failed to run bulk annual license assessments",
    });
  }
}

module.exports = {
  listAssessments,
  getAssessmentById,
  createAssessment,
  bulkAnnualLicense,
};
