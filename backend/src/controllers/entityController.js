'use strict';

const { Entity, EntityType, EntityOwnership } = require('../../models');

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

module.exports = {
  listEntities,
  createEntity,
  getEntityById,
  getEntityOwnership,
  getEntityTypes,
};
