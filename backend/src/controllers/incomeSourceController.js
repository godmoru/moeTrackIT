'use strict';

const { IncomeSource, IncomeSourceParameter } = require('../../models');

async function listIncomeSources(req, res) {
  try {
    const sources = await IncomeSource.findAll({
      include: [{ model: IncomeSourceParameter, as: 'parameters' }],
      order: [['name', 'ASC']],
    });
    res.json(sources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch income sources' });
  }
}

async function createIncomeSource(req, res) {
  try {
    const data = req.body;
    const source = await IncomeSource.create(data);
    res.status(201).json(source);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create income source' });
  }
}

async function getIncomeSourceById(req, res) {
  try {
    const { id } = req.params;
    const source = await IncomeSource.findOne({
      where: { id },
      include: [{ model: IncomeSourceParameter, as: 'parameters' }],
    });

    if (!source) {
      return res.status(404).json({ message: 'Income source not found' });
    }

    res.json(source);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch income source' });
  }
}

async function updateIncomeSource(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const source = await IncomeSource.update(data, { where: { id } }, { returning: true });
    res.json(source);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update income source' });
  }
}

async function deleteIncomeSource(req, res) {
  try {
    const { id } = req.params;
    await IncomeSource.destroy({ where: { id } });
    res.json({ message: 'Income source deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete income source' });
  }
}

async function listIncomeSourceParameters(req, res) {
  try {
    const parameters = await IncomeSourceParameter.findAll({
      include: [{ model: IncomeSource, as: 'incomeSource' }],
      order: [['name', 'ASC']],
    });
    res.json(parameters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch income source parameters' });
  }
}

async function createIncomeSourceParameter(req, res) {
  try {
    const data = req.body;
    const parameter = await IncomeSourceParameter.create(data);
    res.status(201).json(parameter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create income source parameter' });
  }
}

async function updateIncomeSourceParameter(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const parameter = await IncomeSourceParameter.update(data, { where: { id } }, { returning: true });
    res.json(parameter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update income source parameter' });
  }
}

async function deleteIncomeSourceParameter(req, res) {
  try {
    const { id } = req.params;
    await IncomeSourceParameter.destroy({ where: { id } });
    res.json({ message: 'Income source parameter deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete income source parameter' });
  }
}

module.exports = {
  listIncomeSources,
  createIncomeSource,
  getIncomeSourceById,
  updateIncomeSource,
  deleteIncomeSource,
  listIncomeSourceParameters,
  createIncomeSourceParameter,
  updateIncomeSourceParameter,
  deleteIncomeSourceParameter,
};
