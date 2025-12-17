'use strict';

const path = require('path');
const { Entity, EntityType, EntityOwnership, Assessment, Payment, sequelize } = require('../../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const { getEntityScopeWhere } = require('../middleware/scope');

function formatAmount(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function listEntities(req, res) {
  try {
    // Apply scope filtering for principals (own entity) and AEOs (assigned LGA)
    const scopeWhere = getEntityScopeWhere(req.user);

    const entities = await Entity.findAll({
      where: scopeWhere,
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
    const scopeWhere = getEntityScopeWhere(req.user);

    const entity = await Entity.findOne({
      where: { id, ...scopeWhere },
    });
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
      // include: [
      //   { model: Entity, as: 'entity' },
      //   // { model: EntityOwnership, as: 'ownershipType' },
      // ],
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
      // include: [
        // { model: Entity, as: 'entity' },
        // { model: EntityOwnership, as: 'ownershipType' },
      // ],
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

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="institutions.pdf"',
    );

    doc.pipe(res);

    // Header with logo and ministry details
    const logoPath = path.join(__dirname, '../../../frontend/public/benue.png');
    try {
      doc.image(logoPath, 40, 40, { width: 50 });
    } catch (e) {
      // If the logo file is not found, continue without breaking the export
    }

    const headerX = 40;
    const headerWidth = 800 - headerX * 2;

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('Benue State Ministry of Education & Knowledge Management', headerX, 40, {
        width: headerWidth,
        align: 'center',
      })
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(11)
      .text('Education Revenue Management System', headerX, 58, {
        width: headerWidth,
        align: 'center',
      })
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('Institutions 5-Year Payment Summary', headerX, 80, {
        width: headerWidth,
        align: 'center',
      });

    // Horizontal rule under header
    doc.moveTo(40, 110).lineTo(800, 110).stroke();
    doc.moveDown(1);

    // doc.font('Helvetica').fontSize(10).text(`Total institutions: ${entities.length}`);
    // doc.moveDown(0.5);

    const startY = doc.y;
    // 8 columns: ID, Name, 5 years, Total
    const columnWidths = [40, 220, 70, 70, 70, 70, 70, 80];


    const headers = [
      'S/No.',
      'Name',
      ...years.map((y) => String(y)),
      'Total 5 yrs',
    ];

    // Compute x positions cumulatively
    const xPositions = [];
    let currentX = 40; // left margin
    for (let i = 0; i < columnWidths.length; i++) {
      xPositions.push(currentX);
      currentX += columnWidths[i];
    }

    doc.font('Helvetica-Bold');
    headers.forEach((h, idx) => {
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(h, xPositions[idx], startY, {
        width: columnWidths[idx],
        underline: true,
        // Keep the S/No. & Name column headers left-aligned; numeric columns stay right-aligned
        align: idx < 2 ? 'left' : 'right',
      });
    });

    doc.moveDown(1.2);
    doc.font('Helvetica');

    let y = startY + 16;
    const lineHeight = 14;

    const yearTotals = years.map(() => 0);
    let grandTotal = 0;

    entities.forEach((e, index) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }

      const key = `${e.id}`;
      const entry = totalsMap.get(key) || {};
      const yearValues = years.map((yr) => Number(entry[yr] || 0));
      const totalFiveYears = yearValues.reduce((sum, v) => sum + v, 0);

      doc.text(String(index + 1), xPositions[0], y, {
        width: columnWidths[0],
        align: 'left',
      });
      doc.text(e.name || '', xPositions[1], y, {
        width: columnWidths[1],
      });

      yearValues.forEach((val, idx) => {
        // Always show a number (0 when there is no data), formatted as currency
        doc.text(formatAmount(val), xPositions[2 + idx], y, {
          width: columnWidths[2 + idx],
          align: 'right',
        });
        yearTotals[idx] += val;
        grandTotal += val;
      });

      doc.text(formatAmount(totalFiveYears), xPositions[headers.length - 1], y, {
        width: columnWidths[columnWidths.length - 1],
        align: 'right',
      });

      y += lineHeight;
    });

    // Totals row
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }

    // Visual separation before totals row
    doc.moveTo(40, y - 4).lineTo(800, y - 4).stroke();

    doc.font('Helvetica-Bold');
    doc.text('TOTAL', xPositions[0], y, { width: columnWidths[0] });
    yearTotals.forEach((val, idx) => {
      doc.text(formatAmount(val), xPositions[2 + idx], y, {
        width: columnWidths[2 + idx],
        align: 'right',
      });
    });
    doc.text(`₦ ${formatAmount(grandTotal)}`, xPositions[headers.length - 1], y, {
      width: columnWidths[columnWidths.length - 1],
      align: 'right',
    });

    // Signature section at bottom of last page

    // Signature section on separate footer page
    // doc.addPage();
    let footerY = doc.page.height - 140; // near bottom with margin

    doc.moveTo(80, footerY).lineTo(260, footerY).stroke();
    doc.text('Prepared by', 80, footerY + 4, { width: 180 });

    doc.moveTo(320, footerY).lineTo(500, footerY).stroke();
    doc.text('Reviewed by', 320, footerY + 4, { width: 180 });

    doc.moveTo(560, footerY).lineTo(740, footerY).stroke();
    doc.text('Approved by', 560, footerY + 4, { width: 180 });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export institutions PDF' });
    }
  }
}

/**
 * GET /api/v1/entities/export-template
 * Download a CSV template for bulk import
 */
async function downloadImportTemplate(req, res) {
  try {
    // Fetch entity types and ownerships for reference
    const entityTypes = await EntityType.findAll({ order: [['name', 'ASC']] });
    const ownerships = await EntityOwnership.findAll({ order: [['name', 'ASC']] });

    const header = [
      'id',
      'name',
      'code',
      'entityTypeId',
      'entityOwnershipId',
      'state',
      'lga',
      'lgaId',
      'address',
      'contactPerson',
      'contactPhone',
      'contactEmail',
      'status',
      'category',
    ];

    // Add reference rows as comments
    const typeRef = `# Entity Types: ${entityTypes.map((t) => `${t.id}=${t.name}`).join(', ')}`;
    const ownerRef = `# Ownership Types: ${ownerships.map((o) => `${o.id}=${o.name}`).join(', ')}`;
    const instructions = [
      '# BULK IMPORT TEMPLATE FOR ENTITIES',
      '# Instructions:',
      '# - Leave "id" empty for new entities, or provide existing ID to update',
      '# - entityTypeId and entityOwnershipId should be numeric IDs (see references below)',
      '# - status should be: active, inactive, or suspended',
      '# - Remove these comment lines before importing',
      typeRef,
      ownerRef,
      '',
    ];

    const csv = [...instructions, header.join(',')].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="entities-import-template.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate import template' });
  }
}

/**
 * GET /api/v1/entities/export-for-update
 * Export all entities in a format suitable for bulk update
 */
async function exportForBulkUpdate(req, res) {
  try {
    const entities = await Entity.findAll({
      include: [
        { model: EntityType, as: 'entityType' },
        { model: EntityOwnership, as: 'ownershipType' },
      ],
      order: [['name', 'ASC']],
    });

    const header = [
      'id',
      'name',
      'code',
      'entityTypeId',
      'entityTypeName',
      'entityOwnershipId',
      'ownershipName',
      'state',
      'lga',
      'lgaId',
      'address',
      'contactPerson',
      'contactPhone',
      'contactEmail',
      'status',
      'category',
    ];

    const escape = (value) => {
      if (value == null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = entities.map((e) => [
      e.id,
      e.name || '',
      e.code || '',
      e.entityTypeId || '',
      e.entityType?.name || '',
      e.entityOwnershipId || '',
      e.ownershipType?.name || '',
      e.state || '',
      e.lga || '',
      e.lgaId || '',
      e.address || '',
      e.contactPerson || '',
      e.contactPhone || '',
      e.contactEmail || '',
      e.status || '',
      e.category || '',
    ]);

    const lines = [header, ...rows].map((row) => row.map(escape).join(','));
    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="entities-for-update.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export entities for update' });
  }
}

/**
 * POST /api/v1/entities/bulk-import
 * Import entities from CSV data
 * Expects JSON body with { rows: [...] } where each row is an object
 */
async function bulkImportEntities(req, res) {
  const t = await sequelize.transaction();
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No data provided for import' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    // Validate entity types and ownerships exist
    const entityTypes = await EntityType.findAll({ transaction: t });
    const ownerships = await EntityOwnership.findAll({ transaction: t });
    const typeIds = new Set(entityTypes.map((t) => t.id));
    const ownerIds = new Set(ownerships.map((o) => o.id));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        // Skip empty rows
        if (!row.name || row.name.trim() === '') {
          continue;
        }

        // Validate required fields
        if (!row.name) {
          results.errors.push({ row: rowNum, error: 'Name is required' });
          continue;
        }

        // Validate entityTypeId if provided
        if (row.entityTypeId && !typeIds.has(Number(row.entityTypeId))) {
          results.errors.push({ row: rowNum, error: `Invalid entityTypeId: ${row.entityTypeId}` });
          continue;
        }

        // Validate entityOwnershipId if provided
        if (row.entityOwnershipId && !ownerIds.has(Number(row.entityOwnershipId))) {
          results.errors.push({ row: rowNum, error: `Invalid entityOwnershipId: ${row.entityOwnershipId}` });
          continue;
        }

        // Prepare entity data
        const entityData = {
          name: row.name.trim(),
          code: row.code?.trim() || null,
          entityTypeId: row.entityTypeId ? Number(row.entityTypeId) : null,
          entityOwnershipId: row.entityOwnershipId ? Number(row.entityOwnershipId) : null,
          state: row.state?.trim() || null,
          lga: row.lga?.trim() || null,
          lgaId: row.lgaId ? Number(row.lgaId) : null,
          address: row.address?.trim() || null,
          contactPerson: row.contactPerson?.trim() || null,
          contactPhone: row.contactPhone?.trim() || null,
          contactEmail: row.contactEmail?.trim() || null,
          status: row.status?.trim() || 'active',
          category: row.category?.trim() || null,
        };

        if (row.id && row.id !== '') {
          // Update existing entity
          const existing = await Entity.findByPk(Number(row.id), { transaction: t });
          if (!existing) {
            results.errors.push({ row: rowNum, error: `Entity with ID ${row.id} not found` });
            continue;
          }
          await existing.update(entityData, { transaction: t });
          results.updated++;
        } else {
          // Create new entity
          await Entity.create(entityData, { transaction: t });
          results.created++;
        }
      } catch (rowErr) {
        results.errors.push({ row: rowNum, error: rowErr.message });
      }
    }

    // If there are critical errors, rollback
    if (results.errors.length > 0 && results.created === 0 && results.updated === 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'Import failed - no records processed',
        ...results,
      });
    }

    await t.commit();

    res.status(200).json({
      message: `Import completed: ${results.created} created, ${results.updated} updated`,
      ...results,
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    await t.rollback();
    res.status(500).json({ message: 'Failed to import entities: ' + err.message });
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
  downloadImportTemplate,
  exportForBulkUpdate,
  bulkImportEntities,
};
