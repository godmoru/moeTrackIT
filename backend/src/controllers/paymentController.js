"use strict";

const path = require("path");
const { Payment, Assessment, Entity, IncomeSource, User, sequelize } = require("../../models");
const PDFDocument = require('pdfkit');

async function listPayments(req, res) {
  try {
    const payments = await Payment.findAll({
      order: [["paymentDate", "DESC"]],
      include: [
        {
          model: Assessment,
          as: "assessment",
          include: [
            { model: Entity, as: "entity" },
            { model: IncomeSource, as: "incomeSource" },
          ],
        },
        { model: User, as: "recorder" },
      ],
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}

async function createPayment(req, res) {
  const t = await sequelize.transaction();
  try {
    const { assessmentId, amountPaid, paymentDate, method, reference, status = 'confirmed', recordedBy } = req.body;

    const payment = await Payment.create(
      {
        assessmentId,
        amountPaid,
        paymentDate,
        method,
        reference,
        status,
        recordedBy,
      },
      { transaction: t },
    );

    // Update assessment status based on total paid
    const totalPaidResult = await Payment.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid']],
      where: { assessmentId },
      transaction: t,
      raw: true,
    });

    const totalPaid = Number(totalPaidResult.totalPaid || 0);
    const assessment = await Assessment.findByPk(assessmentId, { transaction: t });

    if (assessment) {
      let newStatus = assessment.status;
      const assessed = Number(assessment.amountAssessed || 0);
      if (totalPaid <= 0) newStatus = 'pending';
      else if (totalPaid < assessed) newStatus = 'part_paid';
      else newStatus = 'paid';

      await assessment.update({ status: newStatus }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    await t.rollback();
    res.status(500).json({ message: 'Failed to create payment' });
  }
}

async function paymentInvoice(req, res) {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Assessment,
          as: 'assessment',
          include: [
            { model: Entity, as: 'entity' },
            { model: IncomeSource, as: 'incomeSource' },
          ],
        },
        { model: User, as: 'recorder' },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const assessment = payment.assessment || {};
    const entity = assessment.entity || {};
    const source = assessment.incomeSource || {};
    const recorder = payment.recorder || {};

    const amount = Number(payment.amountPaid || 0);
    const dateLabel = payment.paymentDate
      ? payment.paymentDate.toISOString().slice(0, 10)
      : '';

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${payment.id}.pdf"`,
    );

    doc.pipe(res);

    // Optional watermark: OFFICIAL RECEIPT
    doc.save();
    doc.font("Helvetica-Bold");
    doc.fontSize(60);
    doc.fillColor("#CCCCCC");
    doc.opacity(0.15);
    doc.rotate(-25, { origin: [300, 400] });
    doc.text("OFFICIAL RECEIPT", 60, 350, {
      align: "center",
      width: 500,
    });
    doc.rotate(25, { origin: [300, 400] });
    doc.opacity(1);
    doc.restore();

    // Header with logo and ministry details
    const logoPath = path.join(__dirname, "../../../frontend/public/benue.png");
    try {
      doc.image(logoPath, 40, 40, { width: 60 });
    } catch (e) {
      // If the logo file is not found, continue without breaking the invoice
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Benue State Ministry of Education", 120, 40, {
        align: "left",
      })
      .moveDown(0.2)
      .font("Helvetica")
      .fontSize(11)
      .text("Education Revenue Management System", 120, 58, {
        align: "left",
      })
      .moveDown(0.5)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Payment Invoice", 40, 90, { align: "left" });

    // Horizontal rule under header
    doc.moveTo(40, 110).lineTo(550, 110).stroke();
    doc.moveDown(1);

    const assessmentStatus = assessment.status || null;

    // Invoice meta information
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text(`Invoice No: INV-${payment.id}`);
    doc.font("Helvetica");
    doc.text(`Payment Date: ${dateLabel || '-'}`);
    if (payment.status === 'paid' || assessmentStatus === 'paid') {
      doc.text(`Status: PAID`);
    } else if (payment.status) {
      doc.text(`Status: ${String(payment.status).toUpperCase()}`);
    } else if (assessmentStatus) {
      doc.text(`Status: ${String(assessmentStatus).toUpperCase()}`);
    }
    doc.moveDown(0.5);

    // Entity block
    doc.font("Helvetica-Bold").fontSize(12).text('Payer Details', { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);
    doc.text(`Instituion: ${entity.name || '-'}`);
    if (entity.code) doc.text(`Institution Code: ${entity.code}`);
    if (entity.lga || entity.state) {
      doc.text(
        `Location: ${entity.lga || '-'}, ${entity.state || ''}`.trim(),
      );
    }
    doc.moveDown(1);

    // Payment details block
    doc.font("Helvetica-Bold").fontSize(12).text('Payment Details', { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);

    doc.text(`Purpose: ${source.name || 'Assessment'}`);
    doc.text(
      `Assessment Year: ${
        assessment.assessmentPeriod ? assessment.assessmentPeriod.toString() : '-'
      }`,
    );
    doc.text(`Method: ${payment.method || '-'}`);
    doc.text(`Reference / Purpose: ${payment.reference || '-'}`);
    if (recorder || recorder === 0) {
      const recName = recorder.name || '';
      const recEmail = recorder.email || '';
      if (recName || recEmail) {
        doc.text(
          `Recorded By: ${[recName, recEmail].filter(Boolean).join(' | ')}`,
        );
      }
    }
    doc.moveDown(0.5);

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold");
    doc.text(`Amount Paid (NGN): ${amount.toLocaleString()}`);
    doc.font("Helvetica");
    doc.moveDown(0.5);

    // PAID stamp near top-right if fully paid (payment or assessment status)
    if (payment.status === 'paid' || assessmentStatus === 'paid') {
      const stampDate = dateLabel || '';
      doc.save();
      doc.font("Helvetica-Bold");
      doc.fontSize(18);
      doc.fillColor("#15803d"); // dark green
      doc.opacity(0.85);
      doc.text(
        stampDate ? `PAID\n${stampDate}` : 'PAID',
        400,
        130,
        {
          align: 'center',
          width: 140,
        },
      );
      doc.restore();
    }

    // Footer note (reset styling, directly under amount line)
    doc.font("Helvetica");
    doc.fontSize(9);
    doc.fillColor("#000000");
    doc.text(
      'This invoice serves as an internal record of payment for the Ministry of Education.',
      { width: 500 },
    );

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate payment invoice' });
    }
  }
}

module.exports = {
  listPayments,
  createPayment,
  paymentInvoice,
};
