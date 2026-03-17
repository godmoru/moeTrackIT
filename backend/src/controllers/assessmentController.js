"use strict";

const { Assessment, Entity, IncomeSource, Payment, sequelize } = require("../../models");
const { createAssessmentWithCalculation, calculateAssessmentAmount } = require("../services/assessmentService");
const { getAssessmentScopeWhere } = require('../middleware/scope');

async function listAssessments(req, res) {
  try {
    const { status, lgaId, entityId, incomeSourceId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getAssessmentScopeWhere(req.user);

    const where = { ...scopeWhere };
    if (status && status !== 'all') {
      where.status = status;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    const entityWhere = {};
    if (lgaId) {
      entityWhere.lgaId = lgaId;
    }

    if (incomeSourceId) {
      where.incomeSourceId = incomeSourceId;
    }

    // For AEO scope we need the entity include to filter by lgaId
    const { count, rows: assessments } = await Assessment.findAndCountAll({
      where,
      include: [
        { 
          model: Entity, 
          as: 'entity',
          where: Object.keys(entityWhere).length > 0 ? entityWhere : undefined,
          required: Object.keys(entityWhere).length > 0 || !!scopeWhere['$entity.lgaId$']
        },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset,
      distinct: true, // Required when using includes with limit/offset
      subQuery: false,
    });

    res.json({
      items: assessments,
      total: count,
      page: Number(page),
      limit: Number(limit),
    });
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
      where: {
        id: req.params.id,
        ...scopeWhere
      },
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
      assessmentYear,
      assessmentTerm,
      assessmentPeriod,
      assessmentYears, // Array support
      assessmentTerms, // Array support
      createdBy,
    } = req.body;

    const years = assessmentYears || (assessmentYear ? [assessmentYear] : [null]);
    const terms = assessmentTerms || (assessmentTerm ? [assessmentTerm] : [null]);

    const createdAssessments = [];

    for (const year of years) {
      for (const term of terms) {
        const assessment = await createAssessmentWithCalculation({
          entityId,
          incomeSourceId,
          parameterValues,
          currency,
          status,
          dueDate,
          assessmentYear: year,
          assessmentTerm: term,
          assessmentPeriod,
          createdBy: createdBy || req.user?.id || null,
          transaction: t,
        });
        createdAssessments.push(assessment);
      }
    }

    await t.commit();
    res.status(201).json(createdAssessments.length === 1 ? createdAssessments[0] : { items: createdAssessments, count: createdAssessments.length });

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
/**
 * POST /api/v1/assessments/bulk-create
 *
 * Body:
 * {
 *   incomeSourceId: number,
 *   parameterValues: Object, // Dynamic params (year, term, etc)
 *   dueDate?: string,
 *   lgaNames?: string[],
 *   entityTypeIds?: number[],
 *   entityIds?: number[],       // Explicit list of entity IDs to assess
 *   onlyActive?: boolean
 * }
 */
async function bulkCreate(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      incomeSourceId,
      assessmentYear,
      assessmentTerm,
      assessmentYears, // Array support
      assessmentTerms, // Array support
      parameterValues = {},
      dueDate = null,
      lgaNames,
      entityTypeIds,
      entityIds,
      onlyActive = true,
    } = req.body || {};


    if (!incomeSourceId) {
      return res.status(400).json({
        message: "incomeSourceId is required",
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

    // We calculate a sample assessment just to get the assessmentPeriod 
    // to check for duplicates efficiently. Since we have entities, use the first one.
    // This avoids 'Entity not found' error.
    const sampleEntityId = entities[0].id;
    const { periodYear, periodTerm } = await calculateAssessmentAmount(sampleEntityId, incomeSourceId, parameterValues).catch((err) => {
      console.error("Calculation check failed:", err.message);
      return {};
    });

    let assessmentPeriod = null;

    // 1. Try calculation result
    if (periodYear && periodTerm) {
      assessmentPeriod = `${periodYear}-T${periodTerm}`;
    } else if (periodYear) {
      assessmentPeriod = `${periodYear}`;
    }

    // 2. Try explicit top-level fields
    if (!assessmentPeriod) {
      if (assessmentYear && assessmentTerm) {
        assessmentPeriod = `${assessmentYear}-T${assessmentTerm}`;
      } else if (assessmentYear) {
        assessmentPeriod = `${assessmentYear}`;
      }
    }

    // 3. Fallback to manual string if provided (legacy)
    if (!assessmentPeriod) {
      assessmentPeriod = req.body.assessmentPeriod;
    }

    const foundEntityIds = entities.map((e) => e.id);
    const years = assessmentYears || (assessmentYear ? [assessmentYear] : [null]);
    const terms = assessmentTerms || (assessmentTerm ? [assessmentTerm] : [null]);

    const created = [];
    const skipped = [];

    for (const year of years) {
      for (const term of terms) {
        // Calculate period string for duplicate checking
        let currentPeriod = null;
        if (year && term) {
          currentPeriod = `${year}-T${term}`;
        } else if (year) {
          currentPeriod = `${year}`;
        }

        const existingAssessments = await Assessment.findAll({
          where: {
            entityId: foundEntityIds,
            incomeSourceId,
            assessmentPeriod: currentPeriod,
          },
          transaction: t,
        });

        const alreadyAssessedEntityIds = new Set(
          existingAssessments.map((a) => a.entityId),
        );

        for (const entity of entities) {
          if (alreadyAssessedEntityIds.has(entity.id)) {
            skipped.push({
              entityId: entity.id,
              year,
              term,
              reason: "Already has assessment for this income source and period",
            });
            continue;
          }

          const assessment = await createAssessmentWithCalculation({
            entityId: entity.id,
            incomeSourceId,
            parameterValues,
            status: "pending",
            dueDate,
            assessmentYear: year,
            assessmentTerm: term,
            assessmentPeriod: currentPeriod,
            createdBy: req.user?.id || req.body.createdBy || null,
            transaction: t,
          });

          created.push(assessment);
        }
      }
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
      message: "Failed to run bulk assessments: " + err.message,
    });
  }
}

async function updateAssessment(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const data = req.body;
    const scopeWhere = getAssessmentScopeWhere(req.user);

    // Find the assessment with scope filtering
    const assessment = await Assessment.findOne({
      where: { id, ...scopeWhere },
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
      transaction: t,
    });

    if (!assessment) {
      await t.rollback();
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if assessment has payments - restrict certain edits if paid
    const hasPayments = assessment.payments && assessment.payments.length > 0;

    if (hasPayments) {
      // If assessment has payments, only allow status and notes updates
      const allowedFields = ['status', 'notes', 'dueDate'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      await assessment.update(updateData, { transaction: t });
    } else {
      // No payments - allow full update
      await assessment.update(data, { transaction: t });
    }

    await t.commit();

    // Fetch updated assessment with includes
    const updated = await Assessment.findOne({
      where: { id },
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
        { model: Payment, as: 'payments' },
      ],
    });

    res.json(updated);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to update assessment' });
  }
}

module.exports = {
  listAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  bulkCreate,
};
