import { Op } from 'sequelize';
import { validationResult } from 'express-validator';
import AppError from '../../utils/appError.js';
import { Mda } from '../../models/index.js';

// Default export
const mdaController = {
  getAllMdas,
  getMda,
  createMda,
  updateMda,
  deleteMda,
  getMdaHierarchy,
  getMdaStatistics
};

export default mdaController;

// @desc    Get all MDAs
// @route   GET /api/v1/mdas
// @access  Private/Admin
const getAllMdas = async (req, res, next) => {
  try {
    const { search, type, isActive, page = 1, limit = 10 } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (type) whereClause.type = type;
    if (isActive) whereClause.isActive = isActive === 'true';

    const offset = (page - 1) * limit;
    
    const { count, rows: mdAs } = await Mda.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Mda,
          as: 'parent',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Mda,
          as: 'children',
          attributes: ['id', 'name', 'code', 'type']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: mdAs.length,
      total: count,
      data: {
        mdAs
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single MDA
// @route   GET /api/v1/mdas/:id
// @access  Private
exports.getMda = async (req, res, next) => {
  try {
    const mda = await Mda.findByPk(req.params.id, {
      include: [
        {
          model: Mda,
          as: 'parent',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Mda,
          as: 'children',
          attributes: ['id', 'name', 'code', 'type']
        }
      ]
    });

    if (!mda) {
      return next(new AppError('No MDA found with that ID', 404));
    }

    // Check if user has permission to access this MDA
    if (req.user.role !== 'admin' && req.user.mdaId !== mda.id) {
      return next(
        new AppError('You do not have permission to access this MDA', 403)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        mda
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new MDA
// @route   POST /api/v1/mdas
// @access  Private/Admin
exports.createMda = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      code,
      type,
      description,
      address,
      email,
      phone,
      website,
      parentId
    } = req.body;

    // Check if code already exists
    const existingMda = await Mda.findOne({ where: { code } });
    if (existingMda) {
      return next(new AppError('An MDA with this code already exists', 400));
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentMda = await Mda.findByPk(parentId);
      if (!parentMda) {
        return next(new AppError('No parent MDA found with that ID', 404));
      }
    }

    const mda = await Mda.create({
      name,
      code,
      type,
      description,
      address,
      email: email ? email.toLowerCase() : null,
      phone,
      website,
      parentId,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        mda
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update MDA
// @route   PATCH /api/v1/mdas/:id
// @access  Private/Admin
exports.updateMda = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mda = await Mda.findByPk(req.params.id);
    if (!mda) {
      return next(new AppError('No MDA found with that ID', 404));
    }

    // Check if user has permission to update this MDA
    if (req.user.role !== 'admin' && req.user.mdaId !== mda.id) {
      return next(
        new AppError('You do not have permission to update this MDA', 403)
      );
    }

    const {
      name,
      code,
      type,
      description,
      address,
      email,
      phone,
      website,
      parentId,
      isActive
    } = req.body;

    // Check if code is being updated and if it already exists
    if (code && code !== mda.code) {
      const existingMda = await Mda.findOne({ where: { code } });
      if (existingMda) {
        return next(new AppError('An MDA with this code already exists', 400));
      }
    }

    // If parentId is provided, verify it exists and doesn't create a circular reference
    if (parentId && parentId !== mda.parentId) {
      if (parentId === mda.id) {
        return next(new AppError('An MDA cannot be its own parent', 400));
      }

      // Check if the new parent exists
      const parentMda = await Mda.findByPk(parentId);
      if (!parentMda) {
        return next(new AppError('No parent MDA found with that ID', 404));
      }

      // Check for circular reference
      let currentParentId = parentMda.parentId;
      while (currentParentId) {
        if (currentParentId === mda.id) {
          return next(new AppError('Circular reference detected in MDA hierarchy', 400));
        }
        const currentParent = await Mda.findByPk(currentParentId);
        currentParentId = currentParent ? currentParent.parentId : null;
      }
    }

    // Update MDA
    const updatedMda = await mda.update({
      name: name || mda.name,
      code: code || mda.code,
      type: type || mda.type,
      description: description !== undefined ? description : mda.description,
      address: address !== undefined ? address : mda.address,
      email: email !== undefined ? email.toLowerCase() : mda.email,
      phone: phone !== undefined ? phone : mda.phone,
      website: website !== undefined ? website : mda.website,
      parentId: parentId !== undefined ? parentId : mda.parentId,
      isActive: isActive !== undefined ? isActive : mda.isActive,
      updatedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      data: {
        mda: updatedMda
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete MDA
// @route   DELETE /api/v1/mdas/:id
// @access  Private/Admin
exports.deleteMda = async (req, res, next) => {
  try {
    const mda = await Mda.findByPk(req.params.id);
    if (!mda) {
      return next(new AppError('No MDA found with that ID', 404));
    }

    // Check if MDA has children
    const childrenCount = await Mda.count({ where: { parentId: mda.id } });
    if (childrenCount > 0) {
      return next(
        new AppError(
          'Cannot delete MDA with child MDAs. Please reassign or delete child MDAs first.',
          400
        )
      );
    }

    // Check if MDA has associated budgets or users
    // Note: These associations should be defined in your models
    const budgetCount = await mda.countBudgets();
    const userCount = await mda.countStaff();

    if (budgetCount > 0 || userCount > 0) {
      return next(
        new AppError(
          `Cannot delete MDA with associated ${budgetCount > 0 ? 'budgets' : ''}${
            budgetCount > 0 && userCount > 0 ? ' and ' : ''
          }${userCount > 0 ? 'users' : ''}. Please reassign or delete them first.`,
          400
        )
      );
    }

    await mda.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get MDA hierarchy
// @route   GET /api/v1/mdas/hierarchy
// @access  Private
exports.getMdaHierarchy = async (req, res, next) => {
  try {
    const mdAs = await Mda.findAll({
      where: { parentId: null },
      include: [
        {
          model: Mda,
          as: 'children',
          include: [
            {
              model: Mda,
              as: 'children',
              include: [
                {
                  model: Mda,
                  as: 'children'
                }
              ]
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      results: mdAs.length,
      data: {
        mdAs
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get MDA statistics
// @route   GET /api/v1/mdas/statistics
// @access  Private/Admin
exports.getMdaStatistics = async (req, res, next) => {
  try {
    // Get total number of MDAs
    const totalMdas = await Mda.count();
    
    // Get count by type
    const mdasByType = await Mda.findAll({
      attributes: ['type', [Mda.sequelize.fn('COUNT', Mda.sequelize.col('id')), 'count']],
      group: ['type']
    });

    // Get active/inactive count
    const mdasByStatus = await Mda.findAll({
      attributes: ['isActive', [MDA.sequelize.fn('COUNT', Mda.sequelize.col('id')), 'count']],
      group: ['isActive']
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalMdas,
        mdasByType,
        mdasByStatus
      }
    });
  } catch (err) {
    next(err);
  }
};
