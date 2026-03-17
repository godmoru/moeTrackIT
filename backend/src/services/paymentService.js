'use strict';

const { Payment, Assessment, sequelize } = require('../../models');
const { Op } = require('sequelize');

/**
 * Update assessment status based on confirmed payments
 * @param {number} assessmentId 
 * @param {Object} [transaction] - Optional sequelize transaction
 */
async function updateAssessmentStatus(assessmentId, transaction = null) {
  const options = transaction ? { transaction } : {};
  
  try {
    // Calculate total confirmed/paid payments for this assessment
    const totalPaidResult = await Payment.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid']],
      where: {
        assessmentId,
        status: { [Op.in]: ['confirmed', 'paid'] },
      },
      ...options,
      raw: true,
    });

    const totalPaid = Number(totalPaidResult?.totalPaid || 0);
    const assessment = await Assessment.findByPk(assessmentId, options);

    if (assessment) {
      const assessed = Number(assessment.amountAssessed || 0);
      let newStatus = 'pending';
      
      if (totalPaid >= assessed) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'part_paid';
      }

      console.log(`Updating Assessment ${assessmentId} status to ${newStatus}. Total Paid: ${totalPaid}, Assessed: ${assessed}`);
      await assessment.update({ status: newStatus }, options);
    }
    
    return true;
  } catch (err) {
    console.error('Error updating assessment status:', err);
    throw err;
  }
}

module.exports = {
  updateAssessmentStatus,
};
