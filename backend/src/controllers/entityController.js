'use strict';

const { Entity, EntityType, EntityOwnership, Assessment, Payment, sequelize } = require('../../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');

async function listEntities(req, res) {
  try {
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });
    res.json(entities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch entities' });
  }
}

async function createEntity(req, res) {
  try {
    const data = req.body;
    const entity = await Entity.create(data);
    res.status(201).json(entity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create entity' });
  }
}

async function getEntityById(req, res) {

  try {
    const { id } = req.params;
    const entity = await Entity.findByPk(id);
    if (!entity) {
      return res.status(404).json({ message: 'Entity or School not found' });
    }
    res.json(entity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load entity' });
  }
}

async function getEntityTypes(req, res){
  try {
    const entitieTypes = await EntityType.findAll({
      include: [
        // { model: Entity, as: 'entityType' },
        // { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });
    console.log(entitieTypes);
    res.json(entitieTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create entity types' });
  }
}

async function getEntityOwnership(req, res){
  try {
    const entitieOwnership = await EntityOwnership.findAll({
      include: [
        // { model: Entity, as: 'entityType' },
        // { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });
    console.log(entitieOwnership);
    res.json(entitieOwnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create entity types' });
  }
}

function buildPaymentTotalsByEntityAndYearMap(payments, years) {
  const map = new Map();
  payments.forEach((p) => {
    if (!p['assessment.entityId']) return;
    const entityId = p['assessment.entityId'];
    const date = p.paymentDate;
    if (!date) return;
    const year = new Date(date).getFullYear();
    if (!years.includes(year)) return;
    const key = `${entityId}`;
    if (!map.has(key)) {
      map.set(key, {});
    }
    const entry = map.get(key);
    const current = Number(entry[year] || 0);
    entry[year] = current + Number(p.amountPaid || 0);
  });
  return map;
}

async function exportEntitiesCsv(req, res) {
  try {
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });

    const currentYear = new Date().getFullYear();
    const years = [
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear - 4,
    ];

    const payments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: new Date(currentYear - 4, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1),
        },
      },
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: ['entityId'],
        },
      ],
      attributes: ['amountPaid', 'paymentDate'],
      raw: true,
    });

    const totalsMap = buildPaymentTotalsByEntityAndYearMap(payments, years);

    const header = [
      'ID',
      'Name',
      'Type',
      'Subtype',
      'Ownership',
      'State',
      'LGA',
      'Status',
      ...years.map((y) => `Paid ${y}`),
      'Total 5 years',
    ];

    const rows = entities.map((e) => {
      const base = [
        e.id,
        e.name || '',
        (e.entityType && e.entityType.name) || e.type || '',
        e.subType || '',
        (e.ownershipType && e.ownershipType.name) || e.ownership || '',
        e.state || '',
        e.lga || '',
        e.status || '',
      ];

      const key = `${e.id}`;
      const entry = totalsMap.get(key) || {};
      const yearValues = years.map((y) => Number(entry[y] || 0));
      const totalFiveYears = yearValues.reduce((sum, v) => sum + v, 0);

      return [...base, ...yearValues, totalFiveYears];
    });

    // Column totals per year and overall
    const yearTotals = years.map(() => 0);
    let grandTotal = 0;
    totalsMap.forEach((entry) => {
      years.forEach((y, idx) => {
        const v = Number(entry[y] || 0);
        yearTotals[idx] += v;
        grandTotal += v;
      });
    });

    const summaryRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ...yearTotals,
      grandTotal,
    ];

    const escape = (value) => {
      if (value == null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const lines = [header, ...rows, summaryRow].map((row) => row.map(escape).join(','));
    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="institutions.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export institutions CSV' });
  }
}

async function exportEntitiesExcel(req, res) {
  try {
    // Reuse the same CSV data as exportEntitiesCsv, but serve as an .xls for easier opening in Excel.
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });

    const currentYear = new Date().getFullYear();
    const years = [
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear - 4,
    ];

    const payments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: new Date(currentYear - 4, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1),
        },
      },
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: ['entityId'],
        },
      ],
      attributes: ['amountPaid', 'paymentDate'],
      raw: true,
    });

    const totalsMap = buildPaymentTotalsByEntityAndYearMap(payments, years);

    const header = [
      'ID',
      'Name',
      'Type',
      'Subtype',
      'Ownership',
      'State',
      'LGA',
      'Status',
      ...years.map((y) => `Paid ${y}`),
      'Total 5 years',
    ];

    const rows = entities.map((e) => {
      const base = [
        e.id,
        e.name || '',
        (e.entityType && e.entityType.name) || e.type || '',
        e.subType || '',
        (e.ownershipType && e.ownershipType.name) || e.ownership || '',
        e.state || '',
        e.lga || '',
        e.status || '',
      ];

      const key = `${e.id}`;
      const entry = totalsMap.get(key) || {};
      const yearValues = years.map((y) => Number(entry[y] || 0));
      const totalFiveYears = yearValues.reduce((sum, v) => sum + v, 0);

      return [...base, ...yearValues, totalFiveYears];
    });

    const yearTotals = years.map(() => 0);
    let grandTotal = 0;
    totalsMap.forEach((entry) => {
      years.forEach((y, idx) => {
        const v = Number(entry[y] || 0);
        yearTotals[idx] += v;
        grandTotal += v;
      });
    });

    const summaryRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ...yearTotals,
      grandTotal,
    ];

    const escape = (value) => {
      if (value == null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const lines = [header, ...rows].map((row) => row.map(escape).join(','));
    const csv = lines.join('\n');

    res.setHeader(
      'Content-Type',
      'application/vnd.ms-excel; charset=utf-8',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="institutions.xls"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export institutions Excel' });
  }
}

async function exportEntitiesPdf(req, res) {
  try {
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="institutions.pdf"',
    );

    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(16).text('Institutions Summary', { align: 'left' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(`Total institutions: ${entities.length}`);
    doc.moveDown(1);

    const startY = doc.y;
    const columnWidths = [40, 180, 120, 120];

    const headers = ['ID', 'Name', 'Type', 'LGA'];
    const xPositions = [40, 40 + columnWidths[0], 40 + columnWidths[0] + columnWidths[1], 40 + columnWidths[0] + columnWidths[1] + columnWidths[2]];

    doc.font('Helvetica-Bold');
    headers.forEach((h, idx) => {
      doc.text(h, xPositions[idx], startY, { width: columnWidths[idx], underline: true });
    });

    doc.moveDown(1.2);
    doc.font('Helvetica');

    let y = startY + 16;
    const lineHeight = 14;

    entities.forEach((e) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }

      const typeLabel = (e.entityType && e.entityType.name) || e.type || '';
      const lgaLabel = e.lga || '';

      doc.text(String(e.id), xPositions[0], y, { width: columnWidths[0] });
      doc.text(e.name || '', xPositions[1], y, { width: columnWidths[1] });
      doc.text(typeLabel, xPositions[2], y, { width: columnWidths[2] });
      doc.text(lgaLabel, xPositions[3], y, { width: columnWidths[3] });

      y += lineHeight;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export institutions PDF' });
    }
  }
}

module.exports = {
  listEntities,
  createEntity,
  getEntityById,
  getEntityOwnership,
  getEntityTypes,
  exportEntitiesCsv,
  exportEntitiesExcel,
  exportEntitiesPdf,
};
