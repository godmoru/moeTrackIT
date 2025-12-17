'use strict';

const { EntityType } = require('../../models');

async function listTypes(req, res) {
  try {
    const eTypes = await EntityType.findAll({
      include: [{ model: Entity, as: 'entities', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });
    res.json(eTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list Institution Types' });
  }
}

async function createeType(req, res) {
  try {
    const { name, code, description } = req.body || {};
    if (!name || !code) {
      return res.status(400).json({ message: 'name and code are required' });
    }

    const existing = await EntityType.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({ message: 'Institution Type with this code already exists' });
    }

    const eType = await EntityType.create({ name, code, description });
    res.status(201).json(eType);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create entity type' });
  }
}

async function updateeType(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body || {};

    const eType = await EntityType.findByPk(id);
    if (!eType) {
      return res.status(404).json({ message: 'Institution Type not found' });
    }

    if (name) eType.name = name;
    if (description !== undefined) eType.description = description;

    await eType.save();
    res.json(eType);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update institution type' });
  }
}


module.exports = {
  listTypes,
  createeType,
  updateeType,
};
