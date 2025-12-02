'use strict';

const { Lga } = require('../../models');

async function listLGAs(req, res) {
  try {
    const lgas = await Lga.findAll({ order: [['name', 'ASC']] });
    res.json(lgas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch LGAs' });
  }
}

async function createLga(req, res) {
  try {
    const data = req.body;
    const lga = await Lga.create(data);
    res.status(201).json(lga);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create LGA' });
  }
}

async function updateLga(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const lga = await Lga.update(data, { where: { id } });
    res.json(lga);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update LGA' });
  }
}

async function deleteLga(req, res) {
  try {
    const { id } = req.params;
    await Lga.destroy({ where: { id } });
    res.json({ message: 'LGA deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete LGA' });
  }
}

async function getLgaById(req, res) {
  try {
    const { id } = req.params;
    const lga = await Lga.findByPk(id);
    if (!lga) {
      return res.status(404).json({ message: 'LGA not found' });
    }
    res.json(lga);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch LGA' });
  }
}

async function getLGAEntities(req, res) {
  try {
    const { id } = req.params;
    const entities = await Lga.findByPk(id, { include: ['entities'] });
    if (!entities) {
      return res.status(404).json({ message: 'LGA not found' });
    }
    res.json(entities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch LGA entities' });
  }
}

module.exports = {
  listLGAs,
  createLga,
  updateLga,
  deleteLga,
  getLgaById,
  getLGAEntities,
};
