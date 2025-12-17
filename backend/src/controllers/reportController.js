"use strict";

const { Assessment, Payment, IncomeSource, Entity, sequelize } = require("../../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

async function summary(req, res) {
  try {
    const { from, to } = req.query;

    const wherePayments = {};
    if (from) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.gte]: from };
    if (to) wherePayments.paymentDate = { ...(wherePayments.paymentDate || {}), [Op.lte]: to };

    // Total collections
    const totalResult = await Payment.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalCollected']],
      where: wherePayments,
      raw: true,
    });

    // Collections by income source
    const bySource = await Payment.findAll({
      attributes: [
        'assessmentId',
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'amount'],
      ],
      where: wherePayments,
      group: ['assessmentId'],
      raw: true,
    });

    // For simplicity, also return counts by status from Assessments
    const statusCounts = await Assessment.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    res.json({
      totalCollected: Number(totalResult.totalCollected || 0),
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
    const entities = await Entity.findAll({
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

    const wherePayments = {};
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

    const entity = await Entity.findByPk(id);
    if (!entity) {
      return res.status(404).json({ message: "Entity not found" });
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
          `${dateLabel} • ${p.method || ""} • ${
            p.reference || ""
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
          `${a.assessmentPeriod || "-"} • ${
            a.incomeSource ? a.incomeSource.name : "Assessment"
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

async function getRemittanceByLgaRows(from, to) {
  const wherePayments = {};
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
    const items = await getRemittanceByLgaRows(from, to);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate LGA remittance summary' });
  }
}

async function exportRemittanceByLgaCsv(req, res) {
  try {
    const { from, to } = req.query;
    const items = await getRemittanceByLgaRows(from, to);

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
    const items = await getRemittanceByLgaRows(from, to);

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
    const items = await getRemittanceByLgaRows(from, to);

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
      if (y > doc.page.height - 60) {
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
  exportEntitySummaryPdf,
};
