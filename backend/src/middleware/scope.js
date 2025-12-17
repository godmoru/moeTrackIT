'use strict';

const { Op } = require('sequelize');

/**
 * Scope middleware utilities for role-based data filtering.
 *
 * Principals can only access their own entity (entityId on User).
 * Area Education Officers (AEOs) can only access entities within their assigned LGAs (via UserLga table).
 * Super admins and officers have full access.
 */

/**
 * Builds a Sequelize `where` clause fragment for Entity filtering based on user scope.
 * Returns an empty object for unrestricted roles.
 */
function getEntityScopeWhere(user) {
  if (!user) return {};

  const role = user.role;

  if (role === 'principal') {
    // Principal can only see their own entity
    if (user.entityId) {
      return { id: user.entityId };
    }
    // If no entityId assigned, deny all (return impossible condition)
    return { id: -1 };
  }

  if (role === 'area_education_officer') {
    // AEO can see entities in their assigned LGAs (multiple possible)
    const assignedLgaIds = user.assignedLgaIds || [];
    if (assignedLgaIds.length > 0) {
      return { lgaId: { [Op.in]: assignedLgaIds } };
    }
    // Fallback to legacy single lgaId if no assignedLgaIds
    if (user.lgaId) {
      return { lgaId: user.lgaId };
    }
    return { id: -1 };
  }

  // super_admin, officer, etc. have full access
  return {};
}

/**
 * Builds a Sequelize `where` clause fragment for Assessment filtering based on user scope.
 * Assessments are linked to entities, so we filter by entityId or by entities in the user's LGAs.
 */
function getAssessmentScopeWhere(user) {
  if (!user) return {};

  const role = user.role;

  if (role === 'principal') {
    if (user.entityId) {
      return { entityId: user.entityId };
    }
    return { entityId: -1 };
  }

  if (role === 'area_education_officer') {
    // AEO can see assessments for entities in their assigned LGAs
    const assignedLgaIds = user.assignedLgaIds || [];
    if (assignedLgaIds.length > 0) {
      return { '$entity.lgaId$': { [Op.in]: assignedLgaIds } };
    }
    // Fallback to legacy single lgaId
    if (user.lgaId) {
      return { '$entity.lgaId$': user.lgaId };
    }
    return { entityId: -1 };
  }

  return {};
}

/**
 * Builds a Sequelize `where` clause fragment for Payment filtering based on user scope.
 * Payments are linked to assessments which are linked to entities.
 */
function getPaymentScopeWhere(user) {
  if (!user) return {};

  const role = user.role;

  if (role === 'principal') {
    if (user.entityId) {
      return { '$assessment.entityId$': user.entityId };
    }
    return { id: -1 };
  }

  if (role === 'area_education_officer') {
    // AEO can see payments for entities in their assigned LGAs
    const assignedLgaIds = user.assignedLgaIds || [];
    if (assignedLgaIds.length > 0) {
      return { '$assessment.entity.lgaId$': { [Op.in]: assignedLgaIds } };
    }
    // Fallback to legacy single lgaId
    if (user.lgaId) {
      return { '$assessment.entity.lgaId$': user.lgaId };
    }
    return { id: -1 };
  }

  return {};
}

/**
 * Express middleware that attaches scope helpers to req for use in controllers.
 */
function attachScope(req, res, next) {
  req.scope = {
    entity: getEntityScopeWhere(req.user),
    assessment: getAssessmentScopeWhere(req.user),
    payment: getPaymentScopeWhere(req.user),
  };
  next();
}

module.exports = {
  getEntityScopeWhere,
  getAssessmentScopeWhere,
  getPaymentScopeWhere,
  attachScope,
};
