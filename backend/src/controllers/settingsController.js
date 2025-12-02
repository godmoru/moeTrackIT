'use strict';

const { Setting } = require('../../models');

async function ensureSettingsRow() {
  let row = await Setting.findOne();
  if (!row) {
    row = await Setting.create({
      portalTitle: 'MOETrackIT - Revenue Monitor',
      invoiceFooter:
        'This receipt is only valid if generated from the official MOETrackIT platform.',
    });
  }
  return row;
}

async function getSettings(req, res) {
  try {
    const row = await ensureSettingsRow();
    res.json({
      portalTitle: row.portalTitle,
      invoiceFooter: row.invoiceFooter,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const { portalTitle, invoiceFooter } = req.body || {};
    const row = await ensureSettingsRow();

    if (typeof portalTitle === 'string' && portalTitle.trim()) {
      row.portalTitle = portalTitle.trim();
    }
    if (typeof invoiceFooter === 'string' && invoiceFooter.trim()) {
      row.invoiceFooter = invoiceFooter.trim();
    }

    await row.save();

    res.json({
      portalTitle: row.portalTitle,
      invoiceFooter: row.invoiceFooter,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
