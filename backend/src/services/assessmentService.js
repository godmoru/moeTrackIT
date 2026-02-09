'use strict';

const { Entity, IncomeSource, IncomeSourceParameter, Assessment } = require('../../models');

/**
 * Calculate assessment amount for a given entity and income source using dynamic parameters.
 * @param {number} entityId
 * @param {number} incomeSourceId
 * @param {Object} parameterValues
 * @returns {Promise<{ amount: number, breakdown: Object, meta: Object, periodYear: any, periodTerm: any }>}
 */
async function calculateAssessmentAmount(entityId, incomeSourceId, parameterValues = {}) {
  const [entity, incomeSource, paramDefs] = await Promise.all([
    Entity.findByPk(entityId),
    IncomeSource.findByPk(incomeSourceId),
    IncomeSourceParameter.findAll({ where: { incomeSourceId } }),
  ]);

  if (!entity) {
    throw new Error('Entity not found');
  }
  if (!incomeSource) {
    throw new Error('Income source not found');
  }

  const breakdown = {};
  const meta = {};
  let periodYear = null;
  let periodTerm = null;

  // Validate required parameters
  for (const def of paramDefs) {
    const value = parameterValues[def.key];
    if (def.required && (value === undefined || value === null || value === '')) {
      throw new Error(`Missing required parameter: ${def.key}`);
    }
  }

  // Start from default amount
  let amount = Number(incomeSource.defaultAmount || 0);
  breakdown.baseAmount = amount;

  // Apply parameters
  for (const def of paramDefs) {
    const value = parameterValues[def.key];
    meta[def.key] = value;

    if (value === undefined || value === null || value === '') {
      continue;
    }

    switch (def.calculationRole) {
      case 'base_amount': {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          amount = numeric;
          breakdown.baseOverride = { key: def.key, value: numeric };
        }
        break;
      }
      case 'multiplier': {
        let multiplier = 1;
        if (def.dataType === 'number') {
          const numeric = Number(value);
          if (!Number.isNaN(numeric)) multiplier = numeric;
        } else if (def.dataType === 'enum' && def.options && def.options.multipliers) {
          multiplier = Number(def.options.multipliers[value] || 1);
        }
        amount *= multiplier;
        breakdown.multipliers = breakdown.multipliers || [];
        breakdown.multipliers.push({ key: def.key, value, multiplier });
        break;
      }
      case 'filter': {
        // Simple eligibility filter: if value is falsy boolean, amount = 0
        if (def.dataType === 'boolean' && value === false) {
          amount = 0;
          breakdown.filteredOutBy = def.key;
        }
        break;
      }
      default:
        // info-only parameters stored in meta
        break;
    }

    if (def.calculationRole === 'period_year') {
      periodYear = value;
    }
    if (def.calculationRole === 'period_term') {
      periodTerm = value;
    }
  }

  return {
    amount,
    breakdown,
    meta,
    periodYear,
    periodTerm,
  };
}

/**
 * Convenience helper to create an Assessment record using the calculated amount.
 */
async function createAssessmentWithCalculation({
  entityId,
  incomeSourceId,
  parameterValues = {},
  currency = 'NGN',
  status = 'pending',
  dueDate = null,
  assessmentPeriod = null,
  createdBy,
  transaction,
}) {
  const { amount, breakdown, meta, periodYear, periodTerm } = await calculateAssessmentAmount(
    entityId,
    incomeSourceId,
    parameterValues,
  );

  let finalAssessmentPeriod = assessmentPeriod;
  if (!finalAssessmentPeriod) {
    if (periodYear && periodTerm) {
      finalAssessmentPeriod = `${periodYear}-T${periodTerm}`;
    } else if (periodYear) {
      finalAssessmentPeriod = `${periodYear}`;
    }
  }

  const assessment = await Assessment.create({
    entityId,
    incomeSourceId,
    amountAssessed: amount,
    currency,
    status,
    dueDate,
    assessmentPeriod: finalAssessmentPeriod,
    meta: { ...meta, breakdown },
    createdBy,
  }, { transaction });

  return assessment;
}

module.exports = {
  calculateAssessmentAmount,
  createAssessmentWithCalculation,
};
