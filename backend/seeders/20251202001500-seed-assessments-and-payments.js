'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [entityRows] = await queryInterface.sequelize.query(
      "SELECT id, name FROM \"Entities\" WHERE name IN ('Makurdi Government Secondary School','Gboko Star Academy')"
    );
    const [sourceRows] = await queryInterface.sequelize.query(
      "SELECT id, code FROM \"IncomeSources\" WHERE code IN ('NSR','ALR')"
    );
    const [userRows] = await queryInterface.sequelize.query(
      "SELECT id, email FROM \"Users\" WHERE email = 'admin@benue-edu.gov'"
    );

    const makurdi = entityRows.find((e) => e.name === 'Makurdi Government Secondary School');
    const gboko = entityRows.find((e) => e.name === 'Gboko Star Academy');
    const nsr = sourceRows.find((s) => s.code === 'NSR');
    const alr = sourceRows.find((s) => s.code === 'ALR');
    const admin = userRows[0];

    const assessments = [];

    if (makurdi && nsr && admin) {
      assessments.push({
        entityId: makurdi.id,
        incomeSourceId: nsr.id,
        amountAssessed: 200000,
        currency: 'NGN',
        status: 'paid',
        dueDate: now,
        assessmentPeriod: '2025',
        meta: { notes: 'Initial registration' },
        createdBy: admin.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (gboko && alr && admin) {
      assessments.push({
        entityId: gboko.id,
        incomeSourceId: alr.id,
        amountAssessed: 75000,
        currency: 'NGN',
        status: 'part_paid',
        dueDate: now,
        assessmentPeriod: '2025',
        meta: { notes: 'Annual license renewal' },
        createdBy: admin.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!assessments.length) return;

    await queryInterface.bulkInsert('Assessments', assessments, {});

    const [assRows] = await queryInterface.sequelize.query(
      "SELECT id, amountAssessed, status FROM \"Assessments\" WHERE assessmentPeriod = '2025'"
    );

    const payments = [];

    const assMak = assRows.find((a) => a.status === 'paid');
    const assGbo = assRows.find((a) => a.status === 'part_paid');

    if (assMak && admin) {
      payments.push({
        assessmentId: assMak.id,
        amountPaid: assMak.amountAssessed,
        paymentDate: now,
        method: 'bank',
        reference: 'PAY-MAK-001',
        status: 'confirmed',
        recordedBy: admin.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (assGbo && admin) {
      payments.push({
        assessmentId: assGbo.id,
        amountPaid: assGbo.amountAssessed * 0.5,
        paymentDate: now,
        method: 'bank',
        reference: 'PAY-GBO-001',
        status: 'confirmed',
        recordedBy: admin.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (payments.length) {
      await queryInterface.bulkInsert('Payments', payments, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Payments', { reference: ['PAY-MAK-001', 'PAY-GBO-001'] }, {});
    await queryInterface.bulkDelete(
      'Assessments',
      { assessmentPeriod: '2025' },
      {}
    );
  },
};
