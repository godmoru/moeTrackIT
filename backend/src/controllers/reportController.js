"use strict";

const { Assessment, Payment, IncomeSource, Entity, sequelize } = require("../../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");

async function summary(req, res) {
  try {
    const { from, to } = req.query;
    const { getPaymentScopeWhere, getAssessmentScopeWhere } = require('../middleware/scope');

    const paymentScope = getPaymentScopeWhere(req.user);
    const assessmentScope = getAssessmentScopeWhere(req.user);

    const wherePayments = {
      ...paymentScope,
    };
    if (from) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.gte]: from };
    if (to) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.lte]: to };

    // Total collections
    const totalResult = await Payment.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalCollected']],
      where: wherePayments,
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: [],
          include: [{ model: Entity, as: 'entity', attributes: [] }]
        }
      ],
      raw: true,
    });

    // Collections by income source
    const bySource = await Payment.findAll({
      attributes: [
        'assessmentId',
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'amount'],
      ],
      where: wherePayments,
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: [],
          include: [{ model: Entity, as: 'entity', attributes: [] }]
        }
      ],
      // Group by Payment.assessmentId (which is the main one) and the included association PKs to satisfy Postgres
      group: ['Payment.assessmentId', 'assessment.id', 'assessment.entity.id'],
      raw: true,
    });

    // For simplicity, also return counts by status from Assessments
    const whereAssessments = {
      ...assessmentScope,
    };

    const statusCounts = await Assessment.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('Assessment.id')), 'count']],
      where: whereAssessments,
      include: [
        { model: Entity, as: 'entity', attributes: [] }
      ],
      group: ['Assessment.status'],
      raw: true,
    });

    res.json({
      totalCollected: Number(totalResult?.totalCollected || 0),
      byAssessment: bySource,
      statusCounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate summary report' });
  }
}

function toCsv(rows, headers) {
  const escape = (value) => {
    if (value == null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = headers.map((h) => escape(h.label)).join(",");
  const lines = rows.map((row) =>
    headers
      .map((h) => {
        const v = row[h.key];
        return escape(v);
      })
      .join(","),
  );
  return [headerLine, ...lines].join("\n");
}

async function exportEntityAssessmentsCsv(req, res) {
  try {
    const { id } = req.params;
    const { getEntityScopeWhere } = require('../middleware/scope');

    // Check access to entity
    const scopeWhere = getEntityScopeWhere(req.user);
    const entity = await Entity.findOne({ where: { id, ...scopeWhere } });

    if (!entity) {
      return res.status(404).json({ message: "Entity not found or access denied" });
    }

    const assessments = await Assessment.findAll({
      where: { entityId: id },
      include: [
        { model: Entity, as: "entity" },
        { model: IncomeSource, as: "incomeSource" },
      ],
      order: [["assessmentPeriod", "ASC"]],
    });

    const rows = assessments.map((a) => ({
      id: a.id,
      entityName: a.entity ? a.entity.name : "",
      year: a.assessmentPeriod || "",
      incomeSource: a.incomeSource ? a.incomeSource.name : "",
      status: a.status || "",
      amountAssessed: a.amountAssessed || "",
    }));

    const headers = [
      { key: "id", label: "Assessment ID" },
      { key: "entityName", label: "Entity" },
      { key: "year", label: "Year" },
      { key: "incomeSource", label: "Income Source" },
      { key: "status", label: "Status" },
      { key: "amountAssessed", label: "Amount Assessed" },
    ];

    const csv = toCsv(rows, headers);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="entity-${id}-assessments.csv"`,
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export entity assessments" });
  }
}

async function exportEntityPaymentsCsv(req, res) {
  try {
    const { id } = req.params;
    const { getEntityScopeWhere } = require('../middleware/scope');

    // Check access to entity
    const scopeWhere = getEntityScopeWhere(req.user);
    const entity = await Entity.findOne({ where: { id, ...scopeWhere } });

    if (!entity) {
      return res.status(404).json({ message: "Entity not found or access denied" });
    }

    const payments = await Payment.findAll({
      include: [
        {
          model: Assessment,
          as: "assessment",
          where: { entityId: id },
          include: [{ model: IncomeSource, as: "IncomeSource" }, { model: Entity, as: "entity" }],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    const rows = payments.map((p) => ({
      id: p.id,
      date: p.paymentDate ? p.paymentDate.toISOString() : "",
      amount: p.amountPaid || "",
      method: p.method || "",
      reference: p.reference || "",
      status: p.status || "",
      entityName: p.assessment && p.assessment.entity ? p.assessment.entity.name : "",
      year: p.assessment ? p.assessment.assessmentPeriod || "" : "",
      incomeSource:
        p.assessment && p.assessment.IncomeSource ? p.assessment.IncomeSource.name : "",
    }));

    const headers = [
      { key: "id", label: "Payment ID" },
      { key: "date", label: "Payment Date" },
      { key: "amount", label: "Amount Paid" },
      { key: "method", label: "Method" },
      { key: "reference", label: "Reference / Purpose" },
      { key: "status", label: "Status" },
      { key: "entityName", label: "Entity" },
      { key: "year", label: "Assessment Year" },
      { key: "incomeSource", label: "Income Source" },
    ];

    const csv = toCsv(rows, headers);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="entity-${id}-payments.csv"`,
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export entity payments" });
  }
}

async function exportEntitiesExcel(req, res) {
  try {
    const { getEntityScopeWhere } = require('../middleware/scope');
    const scopeWhere = getEntityScopeWhere(req.user);

    const entities = await Entity.findAll({
      where: scopeWhere,
      order: [["name", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Entities");

    sheet.columns = [
      { header: "Entity ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 32 },
      { header: "Code", key: "code", width: 16 },
      { header: "Type", key: "type", width: 18 },
      { header: "Ownership", key: "ownership", width: 18 },
      { header: "Category", key: "category", width: 18 },
      { header: "Status", key: "status", width: 12 },
      { header: "State", key: "state", width: 16 },
      { header: "LGA", key: "lga", width: 22 },
    ];

    entities.forEach((e) => {
      sheet.addRow({
        id: e.id,
        name: e.name,
        code: e.code || "",
        type: e.type || e.subType || "",
        ownership: e.ownership || "",
        category: e.category || "",
        status: e.status || "",
        state: e.state || "",
        lga: e.lga || "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="entities.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export entities Excel" });
  }
}

async function exportPaymentsExcel(req, res) {
  try {
    const { from, to } = req.query;
    const { getPaymentScopeWhere } = require('../middleware/scope');
    const paymentScope = getPaymentScopeWhere(req.user);

    const wherePayments = {
      ...paymentScope
    };
    if (from) {
      wherePayments.paymentDate = {
        ...(wherePayments.paymentDate || {}),
        [Op.gte]: from,
      };
    }
    if (to) {
      wherePayments.paymentDate = {
        ...(wherePayments.paymentDate || {}),
        [Op.lte]: to,
      };
    }

    const payments = await Payment.findAll({
      where: wherePayments,
      include: [
        {
          model: Assessment,
          as: "assessment",
          include: [{ model: IncomeSource, as: "incomeSource" }, { model: Entity, as: "entity" }],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "Payment ID", key: "id", width: 10 },
      { header: "Payment Date", key: "date", width: 20 },
      { header: "Amount Paid", key: "amount", width: 16 },
      { header: "Method", key: "method", width: 16 },
      { header: "Reference / Purpose", key: "reference", width: 28 },
      { header: "Status", key: "status", width: 14 },
      { header: "Entity", key: "entityName", width: 28 },
      { header: "Assessment Year", key: "year", width: 16 },
      { header: "Income Source", key: "incomeSource", width: 24 },
    ];

    payments.forEach((p) => {
      const assessed = p.assessment || {};
      const entity = assessed.entity || {};
      const src = assessed.incomeSource || {};
      sheet.addRow({
        id: p.id,
        date: p.paymentDate ? p.paymentDate.toISOString() : "",
        amount: p.amountPaid || "",
        method: p.method || "",
        reference: p.reference || "",
        status: p.status || "",
        entityName: entity.name || "",
        year: assessed.assessmentPeriod || "",
        incomeSource: src.name || "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="payments.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export payments Excel" });
  }
}

async function exportEntitySummaryPdf(req, res) {
  try {
    const { id } = req.params;
    const { getEntityScopeWhere } = require('../middleware/scope');

    // Check access to entity
    const scopeWhere = getEntityScopeWhere(req.user);
    const entity = await Entity.findOne({ where: { id, ...scopeWhere } });

    if (!entity) {
      return res.status(404).json({ message: "Entity not found or access denied" });
    }

    const assessments = await Assessment.findAll({
      where: { entityId: id },
      include: [{ model: IncomeSource, as: "incomeSource" }],
      order: [["assessmentPeriod", "ASC"]],
    });

    const payments = await Payment.findAll({
      include: [
        {
          model: Assessment,
          as: "assessment",
          where: { entityId: id },
          required: true,
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    const totalRevenue = payments.reduce(
      (sum, p) => sum + Number(p.amountPaid || 0),
      0,
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="entity-${id}-summary.pdf"`,
    );

    doc.pipe(res);

    doc.fontSize(14).text("Benue State Ministry of Education", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(11).text("Education Revenue Management System");
    doc.moveDown(1);

    doc.fontSize(16).text("Entity Revenue Summary", { align: "left" });
    doc.moveDown(0.5);

    doc.fontSize(11).text(`Entity: ${entity.name}`);
    if (entity.code) doc.text(`Code: ${entity.code}`);
    doc.text(`Status: ${entity.status || "-"}`);
    if (entity.lga || entity.state) {
      doc.text(
        `Location: ${entity.lga || "-"}, ${entity.state || ""}`.trim(),
      );
    }
    if (entity.category) doc.text(`Category: ${entity.category}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total assessments: ${assessments.length}`);
    doc.text(`Total payments: ${payments.length}`);
    doc.text(`Total revenue collected: ${totalRevenue.toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Recent Payments", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    const recent = payments.slice(0, 10);
    if (!recent.length) {
      doc.text("No payments recorded for this entity yet.");
    } else {
      recent.forEach((p) => {
        const dateLabel = p.paymentDate
          ? p.paymentDate.toISOString().slice(0, 10)
          : "-";
        doc.text(
          `${dateLabel} • ${p.method || ""} • ${p.reference || ""
          } • ${Number(p.amountPaid || 0).toLocaleString()}`,
        );
      });
    }

    doc.moveDown(1);
    doc.fontSize(12).text("Assessments", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    if (!assessments.length) {
      doc.text("No assessments recorded for this entity yet.");
    } else {
      assessments.forEach((a) => {
        doc.text(
          `${a.assessmentPeriod || "-"} • ${a.incomeSource ? a.incomeSource.name : "Assessment"
          } • Status: ${a.status || "-"}`,
        );
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to export entity PDF summary" });
    }
  }
}

async function getRemittanceByLgaRows(req, from, to) {
  const { getPaymentScopeWhere } = require('../middleware/scope');
  const paymentScope = getPaymentScopeWhere(req.user);

  const wherePayments = {
    ...paymentScope
  };

  if (from) {
    wherePayments.paymentDate = {
      ...(wherePayments.paymentDate || {}),
      [Op.gte]: from,
    };
  }
  if (to) {
    wherePayments.paymentDate = {
      ...(wherePayments.paymentDate || {}),
      [Op.lte]: to,
    };
  }

  const rows = await Payment.findAll({
    attributes: [
      [sequelize.col('assessment.entity.lga'), 'lga'],
      [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
    ],
    where: wherePayments,
    include: [
      {
        model: Assessment,
        as: 'assessment',
        include: [{ model: Entity, as: 'entity', attributes: [] }],
        attributes: [],
      },
    ],
    group: ['assessment.entity.lga'],
    raw: true,
  });

  return rows.map((row) => ({
    lga: row.lga || 'Unspecified',
    totalAmount: Number(row.totalAmount || 0),
  }));
}

async function remittanceByLga(req, res) {
  try {
    const { from, to } = req.query;
    const items = await getRemittanceByLgaRows(req, from, to);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate LGA remittance summary' });
  }
}

async function exportRemittanceByLgaCsv(req, res) {
  try {
    const { from, to } = req.query;
    const items = await getRemittanceByLgaRows(req, from, to);

    const rows = items.map((item) => ({
      lga: item.lga,
      totalAmount: item.totalAmount,
    }));

    const headers = [
      { key: 'lga', label: 'LGA' },
      { key: 'totalAmount', label: 'Total Amount Paid' },
    ];

    const csv = toCsv(rows, headers);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="remittance-by-lga.csv"',
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export LGA remittance CSV' });
  }
}

async function exportRemittanceByLgaExcel(req, res) {
  try {
    const { from, to } = req.query;
    const items = await getRemittanceByLgaRows(req, from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Remittance by LGA');

    sheet.columns = [
      { header: 'LGA', key: 'lga', width: 30 },
      { header: 'Total Amount Paid', key: 'totalAmount', width: 22 },
    ];

    items.forEach((item) => {
      sheet.addRow({
        lga: item.lga,
        totalAmount: item.totalAmount,
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="remittance-by-lga.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export LGA remittance Excel' });
  }
}

async function exportRemittanceByLgaPdf(req, res) {
  try {
    const { from, to } = req.query;
    const items = await getRemittanceByLgaRows(req, from, to);

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="remittance-by-lga.pdf"',
    );

    doc.pipe(res);

    doc.fontSize(14).text('Benue State Ministry of Education', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(11).text('Education Revenue Management System');
    doc.moveDown(1);

    doc.fontSize(16).text('Remittance by LGA', { align: 'left' });
    doc.moveDown(0.5);

    if (from || to) {
      doc.fontSize(10).text(`Period: ${from || '...'} to ${to || '...'}`);
      doc.moveDown(0.5);
    }

    doc.fontSize(11).text('Summary of payments grouped by Local Government Area (LGA).');
    doc.moveDown(1);

    doc.fontSize(11).text('LGA', 40, doc.y, { continued: true });
    doc.text('Total Amount Paid (NGN)', 260);
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    let y = doc.y;
    const lineHeight = 16;

    items.forEach((item) => {
      if (y > doc.page.height - 150) { // Safety margin for last-page signature cards
        doc.addPage();
        y = 60;
      }
      doc.fontSize(10).text(item.lga, 40, y, { width: 200 });
      doc.text(Number(item.totalAmount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }), 260, y, { width: 200 });
      y += lineHeight;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export LGA remittance PDF' });
    }
  }
}

async function exportAssessmentsExcel(req, res) {
  try {
    const {
      lga,
      assessmentYear,
      assessmentTerm,
      status,
      incomeSourceId,
      entityTypeId,
      search
    } = req.query;

    const { getAssessmentScopeWhere } = require('../middleware/scope');
    const scopeWhere = getAssessmentScopeWhere(req.user);

    const whereAssessments = {
      ...scopeWhere
    };

    if (assessmentYear) whereAssessments.assessmentYear = assessmentYear;
    if (assessmentTerm) whereAssessments.assessmentTerm = assessmentTerm;
    if (status) whereAssessments.status = status;
    if (incomeSourceId) whereAssessments.incomeSourceId = incomeSourceId;

    const entityWhere = {};
    if (lga) entityWhere.lga = lga;
    if (entityTypeId) entityWhere.entityTypeId = entityTypeId;
    if (search) {
      entityWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const assessments = await Assessment.findAll({
      where: whereAssessments,
      include: [
        {
          model: Entity,
          as: "entity",
          where: Object.keys(entityWhere).length > 0 ? entityWhere : undefined,
          required: Object.keys(entityWhere).length > 0
        },
        { model: IncomeSource, as: "incomeSource" },
        {
          model: Payment,
          as: "payments",
          where: { status: { [Op.in]: ['confirmed', 'paid'] } },
          required: false
        }
      ],
      order: [
        [{ model: Entity, as: 'entity' }, 'name', 'ASC'],
        ['assessmentYear', 'DESC'],
        ['assessmentTerm', 'DESC']
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Assessments");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Entity Name", key: "entityName", width: 35 },
      { header: "LGA", key: "lga", width: 20 },
      { header: "Code", key: "code", width: 15 },
      { header: "Income Source", key: "incomeSource", width: 30 },
      { header: "Period", key: "period", width: 15 },
      { header: "Year", key: "year", width: 10 },
      { header: "Term", key: "term", width: 10 },
      { header: "Amount Assessed", key: "amount", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "RRR", key: "rrr", width: 20 },
      { header: "Paid At", key: "paidAt", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    assessments.forEach((a) => {
      const successfulPayment = a.payments && a.payments.length > 0 ? a.payments[0] : null;

      sheet.addRow({
        id: a.id,
        entityName: a.entity?.name || "",
        lga: a.entity?.lga || "",
        code: a.entity?.code || "",
        incomeSource: a.incomeSource?.name || "",
        period: a.assessmentPeriod || "",
        year: a.assessmentYear || "",
        term: a.assessmentTerm || "",
        amount: Number(a.amountAssessed || 0),
        status: a.status || "",
        rrr: successfulPayment ? (successfulPayment.rrr || "-") : "-",
        paidAt: successfulPayment && successfulPayment.paymentDate
          ? successfulPayment.paymentDate.toISOString().split('T')[0]
          : "-",
        createdAt: a.createdAt ? a.createdAt.toISOString() : "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    // Add number format to Amount column
    sheet.getColumn('amount').numFmt = '#,##0.00';

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="assessments-export.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Assessment Export Error:", err);
    res.status(500).json({ message: "Failed to export assessments Excel" });
  }
}

async function performanceByOwnership(req, res) {
  try {
    const { from, to, lga, lgaId } = req.query;
    const { getPaymentScopeWhere } = require('../middleware/scope');
    const paymentScope = getPaymentScopeWhere(req.user);

    const wherePayments = {
      ...paymentScope,
      status: { [Op.in]: ['confirmed', 'paid'] }
    };

    if (from) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.gte]: from };
    if (to) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.lte]: to };

    const entityWhere = {};
    if (lga) entityWhere.lga = lga;
    if (lgaId) entityWhere.lgaId = lgaId;

    const hasLgaFilter = Object.keys(entityWhere).length > 0;

    const items = await Payment.findAll({
      attributes: [
        [sequelize.col('assessment.entity.ownership'), 'ownership'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('assessment.entity.id'))), 'schoolCount'],
      ],
      where: wherePayments,
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: [],
          required: hasLgaFilter || !!paymentScope['$assessment.entity.lgaId$'],
          include: [{
            model: Entity,
            as: 'entity',
            attributes: [],
            where: hasLgaFilter ? entityWhere : undefined,
            required: hasLgaFilter || !!paymentScope['$assessment.entity.lgaId$']
          }]
        }
      ],
      group: ['assessment.entity.ownership'],
      raw: true,
    });

    res.json({
      items: items.map(item => ({
        ownership: item.ownership || 'Other',
        totalAmount: Number(item.totalAmount || 0),
        schoolCount: Number(item.schoolCount || 0)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate ownership performance report' });
  }
}

async function exportAssessmentsPdf(req, res) {
  try {
    const {
      lga,
      assessmentYear,
      assessmentTerm,
      status,
      incomeSourceId,
      entityTypeId,
      search
    } = req.query;

    const { getAssessmentScopeWhere } = require('../middleware/scope');
    const scopeWhere = getAssessmentScopeWhere(req.user);

    const whereAssessments = {
      ...scopeWhere
    };

    if (assessmentYear) whereAssessments.assessmentYear = assessmentYear;
    if (assessmentTerm) whereAssessments.assessmentTerm = assessmentTerm;
    if (status) whereAssessments.status = status;
    if (incomeSourceId) whereAssessments.incomeSourceId = incomeSourceId;

    const entityWhere = {};
    if (lga) entityWhere.lga = lga;
    if (entityTypeId) entityWhere.entityTypeId = entityTypeId;
    if (search) {
      entityWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const assessments = await Assessment.findAll({
      where: whereAssessments,
      include: [
        {
          model: Entity,
          as: "entity",
          where: Object.keys(entityWhere).length > 0 ? entityWhere : undefined,
          required: Object.keys(entityWhere).length > 0
        },
        { model: IncomeSource, as: "incomeSource" },
        {
          model: Payment,
          as: "payments",
          where: { status: { [Op.in]: ['confirmed', 'paid'] } },
          required: false
        }
      ],
      order: [
        [{ model: Entity, as: 'entity' }, 'name', 'ASC'],
        ['assessmentYear', 'DESC'],
        ['assessmentTerm', 'DESC']
      ],
    });

    const doc = new PDFDocument({
      margin: 40,
      layout: 'landscape',
      size: 'A4',
      bufferPages: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="assessments-export.pdf"',
    );

    doc.pipe(res);

    // Header with Logo
    const logoPath = path.join(__dirname, "../../../frontend/public/benue.png");
    try {
      doc.image(logoPath, {
        fit: [60, 60],
        align: 'center',
        x: (doc.page.width / 2) - 30
      });
      // doc.moveDown(0.5);
    } catch (e) {
      console.warn("Logo not found at", logoPath, "- skipping logo in PDF");
    }

    doc.fontSize(15).font('Helvetica-Bold').text("BENUE STATE MINISTRY OF EDUCATION AND KNOWLEDGE MANAGEMENT", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica').text("Education Revenue Remitancee & Management System", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(18).font('Helvetica-Bold').text("ASSESSMENT REPORT", { align: "center" });
    doc.moveDown(1);

    if (assessmentYear || lga) {
      let filterText = "Filters: ";
      if (lga) filterText += `LGA: ${lga} | `;
      if (assessmentYear) filterText += `Year: ${assessmentYear} | `;
      if (assessmentTerm) filterText += `Term: ${assessmentTerm}`;
      doc.fontSize(10).text(filterText.trim().replace(/ \|$/, ""));
      doc.moveDown(0.5);
    }

    // Table Header
    doc.fontSize(9).font('Helvetica-Bold');
    const startY = doc.y;
    doc.text("Institution", 40, startY, { width: 180 });
    doc.text("LGA", 225, startY, { width: 80 });
    doc.text("Income Source", 310, startY, { width: 120 });
    doc.text("Period", 435, startY, { width: 60 });
    doc.text("Amount (NGN)", 500, startY, { width: 80, align: 'right' });
    doc.text("Status", 590, startY, { width: 60 });
    doc.text("RRR", 655, startY, { width: 80 });
    doc.text("Paid At", 740, startY, { width: 80 });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    let y = doc.y;
    const lineHeight = 16;
    let totalAmount = 0;

    assessments.forEach((a) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }

      const amount = Number(a.amountAssessed || 0);
      totalAmount += amount;

      // Find successful payment if any
      const successfulPayment = a.payments && a.payments.length > 0 ? a.payments[0] : null;
      const rrr = successfulPayment ? (successfulPayment.rrr || "-") : "-";
      const paidAt = successfulPayment && successfulPayment.paymentDate
        ? successfulPayment.paymentDate.toISOString().split('T')[0]
        : "-";

      doc.fontSize(8).text(a.entity?.name.slice(0, 40) || "-", 40, y, { width: 180 });
      doc.text(a.entity?.lga || "-", 225, y, { width: 80 });
      doc.text(a.incomeSource?.name.slice(0, 30) || "-", 310, y, { width: 120 });
      doc.text(a.assessmentPeriod || "-", 435, y, { width: 60 });
      doc.text(`NGN ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 500, y, { width: 80, align: 'right' });
      doc.text((a.status || "-").toUpperCase(), 590, y, { width: 60 });
      doc.text(rrr, 655, y, { width: 80 });
      doc.text(paidAt, 740, y, { width: 80 });

      y += lineHeight;
    });

    doc.moveDown(1);
    doc.moveTo(40, y).lineTo(780, y).stroke();
    doc.moveDown(0.5);
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text("TOTAL", 40, y);
    doc.text(`NGN ${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 500, y, { width: 80, align: 'right' });

    // Finalize footer and page numbers
    const range = doc.bufferedPageRange();
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerTop = pageHeight - 120;
    const margin = 40;
    const boxWidth = 220;
    const boxHeight = 60;
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      /*
      // Page Numbering at bottom center
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text(
        `Page ${i + 1} of ${range.count}`,
        0,
        pageHeight - 30,
        { align: 'center', width: pageWidth }
      );
      */

      // Signatory cards ONLY on the last page
      if (i === range.start + range.count - 1) {
        // Reset alignment/font for boxes
        doc.lineWidth(0.5).strokeColor('#cccccc');

        // Left Box: Generated Info
        const leftX = margin;
        doc.rect(leftX, footerTop, boxWidth, boxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#444444').text("PREPARED BY:", leftX + 5, footerTop + 5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000').text(req.user.name, leftX + 5, footerTop + 20);
        doc.fontSize(8).text(`Date: ${new Date().toLocaleString()}`, leftX + 5, footerTop + boxHeight - 12);

        // Right Box: Vetted Info
        const rightX = pageWidth - margin - boxWidth;
        doc.rect(rightX, footerTop, boxWidth, boxHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#444444').text("VETTED BY:", rightX + 5, footerTop + 5);
        doc.fontSize(8).fillColor('#888888').text("(Signature & Date)", rightX + 5, footerTop + 40);

        // Bottom Stamp Area (Center)
        const centerX = (pageWidth / 2) - 50;
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999999').text("Official Stamp", centerX, footerTop + boxHeight + 5);
      }
    }

    doc.end();
  } catch (err) {
    console.error("Assessment PDF Export Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to export assessments PDF" });
    }
  }
}

module.exports = {
  summary,
  remittanceByLga,
  exportRemittanceByLgaCsv,
  exportRemittanceByLgaExcel,
  exportRemittanceByLgaPdf,
  exportEntityAssessmentsCsv,
  exportEntityPaymentsCsv,
  exportEntitiesExcel,
  exportPaymentsExcel,
  exportAssessmentsExcel,
  exportAssessmentsPdf,
  exportEntitySummaryPdf,
  performanceByOwnership,
};
