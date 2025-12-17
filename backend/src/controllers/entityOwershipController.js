'use strict';

const { EntityOwnership } = require('../../models');

async function listOwnership(req, res) {
  try {
    const eOwnership = await EntityOwnership.findAll({
      include: [{ model: Entity, as: 'entities', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });
    res.json(eOwnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list Institution Ownership' });
  }
}

async function createOwnership(req, res) {
  try {
    const { name, description } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'name field is required to create insitution ownership' });
    }

    const existing = await EntityOwnership.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: 'Institution ownership with this name already exists' });
    }

    const eOwnership = await EntityOwnership.create({ name, description });
    res.status(201).json(eOwnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create institution ownership model' });
  }
}

async function updateeOwnership(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body || {};

    const eOwnership = await EntityOwnership.findByPk(id);
    if (!eOwnership) {
      return res.status(404).json({ message: 'Institution ownership not found' });
    }

    if (name) eOwnership.name = name;
    if (description !== undefined) eOwnership.description = description;

    await eOwnership.save();
    res.json(eOwnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update institution ownership' });
  }
}


module.exports = {
  listOwnership,
  createOwnership,
  updateeOwnership,
};
