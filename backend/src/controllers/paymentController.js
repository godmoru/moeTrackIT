"use strict";

const path = require("path");
const { Payment, Assessment, Entity, IncomeSource, User, Setting, sequelize } = require("../../models");
const PDFDocument = require('pdfkit');
const { getPaymentScopeWhere } = require('../middleware/scope');
const {
  initializePayment,
  verifyPayment,
  validateWebhookSignature,
  generatePaymentReference,
} = require('../services/paystackService');

async function listPayments(req, res) {
  try {
    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getPaymentScopeWhere(req.user);

    const payments = await Payment.findAll({
      where: scopeWhere,
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

async function getPaymentById(req, res) {
  try {
    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getPaymentScopeWhere(req.user);

    const payment = await Payment.findOne({
      where: { id: req.params.id },
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
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payment" });
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
    let invoiceFooterText =
      'This receipt is only valid if generated from the official MOETrackIT platform.';
    try {
      const settingRow = await Setting.findOne();
      if (settingRow && settingRow.invoiceFooter) {
        invoiceFooterText = settingRow.invoiceFooter;
      }
    } catch (e) {
      // If settings cannot be loaded, fall back to default text silently
    }

    doc.font("Helvetica");
    doc.fontSize(9);
    doc.fillColor("#000000");
    doc.text(invoiceFooterText, { width: 500 });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate payment invoice' });
    }
  }
}

/**
 * POST /api/v1/payments/initialize
 * Initialize an online payment with Paystack
 * For principals and AEOs to pay their school's assessments
 */
async function initializeOnlinePayment(req, res) {
  try {
    const { assessmentId, amount, email, name } = req.body;
    const user = req.user;

    if (!assessmentId || !amount || !email) {
      return res.status(400).json({
        message: 'assessmentId, amount, and email are required',
      });
    }

    // Verify the assessment exists and user has access
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [
        { model: Entity, as: 'entity' },
        { model: IncomeSource, as: 'incomeSource' },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check user scope - principals can only pay for their entity
    if (user.role === 'principal' && user.entityId !== assessment.entityId) {
      return res.status(403).json({
        message: 'You can only pay for assessments assigned to your institution',
      });
    }

    // Check if amount is valid
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Generate unique reference
    const reference = generatePaymentReference(assessmentId);

    // Get callback URL from environment or construct default
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/payments/verify`;

    // Initialize payment with Paystack
    const paystackResult = await initializePayment({
      email,
      amount: amountNum,
      reference,
      callbackUrl,
      metadata: {
        assessmentId,
        entityId: assessment.entityId,
        entityName: assessment.entity?.name,
        incomeSourceName: assessment.incomeSource?.name,
        assessmentPeriod: assessment.assessmentPeriod,
        userId: user.id,
        userName: user.name,
      },
    });

    // Create pending payment record
    const payment = await Payment.create({
      assessmentId,
      amountPaid: amountNum,
      paymentDate: new Date(),
      method: 'online',
      reference,
      status: 'pending',
      recordedBy: user.id,
      paystackReference: paystackResult.reference,
      paystackAccessCode: paystackResult.accessCode,
      payerEmail: email,
      payerName: name || user.name,
      paymentType: 'online',
    });

    res.status(200).json({
      message: 'Payment initialized successfully',
      paymentId: payment.id,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      reference: paystackResult.reference,
    });
  } catch (err) {
    console.error('Failed to initialize payment:', err);
    res.status(500).json({
      message: err.message || 'Failed to initialize payment',
    });
  }
}

/**
 * GET /api/v1/payments/verify/:reference
 * Verify a payment after Paystack callback
 */
async function verifyOnlinePayment(req, res) {
  const t = await sequelize.transaction();
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Find the pending payment
    const payment = await Payment.findOne({
      where: { paystackReference: reference },
      include: [
        {
          model: Assessment,
          as: 'assessment',
          include: [{ model: Entity, as: 'entity' }],
        },
      ],
      transaction: t,
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    // If already verified, return current status
    if (payment.status === 'confirmed' || payment.status === 'paid') {
      await t.rollback();
      return res.status(200).json({
        message: 'Payment already verified',
        status: payment.status,
        paymentId: payment.id,
      });
    }

    // Verify with Paystack
    const verification = await verifyPayment(reference);

    if (verification.status === 'success') {
      // Update payment record
      await payment.update({
        status: 'confirmed',
        channel: verification.channel,
        payerEmail: verification.customerEmail || payment.payerEmail,
        payerName: verification.customerName || payment.payerName,
        gatewayResponse: JSON.stringify(verification.raw),
        paymentDate: verification.paidAt ? new Date(verification.paidAt) : payment.paymentDate,
      }, { transaction: t });

      // Update assessment status based on total paid
      const totalPaidResult = await Payment.findOne({
        attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid']],
        where: {
          assessmentId: payment.assessmentId,
          status: { [sequelize.Op.in]: ['confirmed', 'paid'] },
        },
        transaction: t,
        raw: true,
      });

      const totalPaid = Number(totalPaidResult?.totalPaid || 0);
      const assessment = await Assessment.findByPk(payment.assessmentId, { transaction: t });

      if (assessment) {
        const assessed = Number(assessment.amountAssessed || 0);
        let newStatus = 'pending';
        if (totalPaid >= assessed) newStatus = 'paid';
        else if (totalPaid > 0) newStatus = 'part_paid';

        await assessment.update({ status: newStatus }, { transaction: t });
      }

      await t.commit();

      return res.status(200).json({
        message: 'Payment verified successfully',
        status: 'success',
        paymentId: payment.id,
        amount: verification.amount,
        channel: verification.channel,
      });
    } else {
      // Payment failed or abandoned
      await payment.update({
        status: 'failed',
        gatewayResponse: JSON.stringify(verification.raw),
      }, { transaction: t });

      await t.commit();

      return res.status(200).json({
        message: 'Payment was not successful',
        status: verification.status,
        paymentId: payment.id,
      });
    }
  } catch (err) {
    console.error('Failed to verify payment:', err);
    await t.rollback();
    res.status(500).json({
      message: err.message || 'Failed to verify payment',
    });
  }
}

/**
 * POST /api/v1/payments/webhook
 * Paystack webhook handler for payment events
 */
async function paystackWebhook(req, res) {
  try {
    // Validate webhook signature
    const signature = req.headers['x-paystack-signature'];
    const rawBody = JSON.stringify(req.body);

    if (!validateWebhookSignature(signature, rawBody)) {
      console.error('Invalid Paystack webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      // Find and update the payment
      const payment = await Payment.findOne({
        where: { paystackReference: reference },
      });

      if (payment && payment.status !== 'confirmed') {
        const t = await sequelize.transaction();
        try {
          await payment.update({
            status: 'confirmed',
            channel: data.channel,
            payerEmail: data.customer?.email || payment.payerEmail,
            payerName: `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() || payment.payerName,
            gatewayResponse: JSON.stringify(data),
            paymentDate: data.paid_at ? new Date(data.paid_at) : payment.paymentDate,
          }, { transaction: t });

          // Update assessment status
          const totalPaidResult = await Payment.findOne({
            attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid']],
            where: {
              assessmentId: payment.assessmentId,
              status: { [sequelize.Op.in]: ['confirmed', 'paid'] },
            },
            transaction: t,
            raw: true,
          });

          const totalPaid = Number(totalPaidResult?.totalPaid || 0);
          const assessment = await Assessment.findByPk(payment.assessmentId, { transaction: t });

          if (assessment) {
            const assessed = Number(assessment.amountAssessed || 0);
            let newStatus = 'pending';
            if (totalPaid >= assessed) newStatus = 'paid';
            else if (totalPaid > 0) newStatus = 'part_paid';

            await assessment.update({ status: newStatus }, { transaction: t });
          }

          await t.commit();
          console.log(`Webhook: Payment ${reference} confirmed via webhook`);
        } catch (err) {
          await t.rollback();
          console.error('Webhook processing error:', err);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ received: true }); // Still acknowledge to prevent retries
  }
}

/**
 * GET /api/v1/payments/my-assessments
 * Get assessments for the current user's entity (for principals/AEOs to pay)
 */
async function getMyAssessments(req, res) {
  try {
    const user = req.user;
    const { Op } = require('sequelize');

    let assessments;

    if (user.role === 'principal') {
      if (!user.entityId) {
        return res.status(400).json({
          message: 'Your account is not linked to an institution',
        });
      }
      
      assessments = await Assessment.findAll({
        where: { entityId: user.entityId },
        include: [
          { model: Entity, as: 'entity' },
          { model: IncomeSource, as: 'incomeSource' },
          { model: Payment, as: 'payments' },
        ],
        order: [['createdAt', 'DESC']],
      });
    } else if (user.role === 'area_education_officer') {
      // AEO can see assessments for ALL entities in their assigned LGAs
      const assignedLgaIds = user.assignedLgaIds || [];
      
      if (assignedLgaIds.length === 0 && !user.lgaId) {
        return res.status(400).json({
          message: 'Your account is not assigned to any LGA',
        });
      }

      // Build LGA filter - support both multiple LGAs and legacy single LGA
      const lgaFilter = assignedLgaIds.length > 0
        ? { lgaId: { [Op.in]: assignedLgaIds } }
        : { lgaId: user.lgaId };

      assessments = await Assessment.findAll({
        include: [
          { 
            model: Entity, 
            as: 'entity',
            where: lgaFilter,
            required: true,
          },
          { model: IncomeSource, as: 'incomeSource' },
          { model: Payment, as: 'payments' },
        ],
        order: [
          [{ model: Entity, as: 'entity' }, 'name', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });
    } else {
      return res.status(403).json({
        message: 'Only principals and AEOs can access this endpoint',
      });
    }

    // Calculate balance for each assessment
    const result = assessments.map((a) => {
      const assessed = Number(a.amountAssessed || 0);
      const paid = (a.payments || [])
        .filter((p) => p.status === 'confirmed' || p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
      const balance = assessed - paid;

      return {
        id: a.id,
        entityId: a.entityId,
        entityName: a.entity?.name,
        entityLga: a.entity?.lga,
        entityCode: a.entity?.code,
        incomeSourceId: a.incomeSourceId,
        incomeSourceName: a.incomeSource?.name,
        assessmentPeriod: a.assessmentPeriod,
        amountAssessed: assessed,
        amountPaid: paid,
        balance,
        status: a.status,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to get assessments:', err);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
}

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  paymentInvoice,
  initializeOnlinePayment,
  verifyOnlinePayment,
  paystackWebhook,
  getMyAssessments,
};
