const ExpenditureService = require('../../services/v1/expenditure.service.js');
const ExpenditureCategoryService = require('../../services/v1/expenditureCategory.service.js');
const catchAsync = require('../../utils/catchAsync.js');

/**
 * Create a new expenditure
 */
const createExpenditure = catchAsync(async (req, res) => {
    const expenditure = await ExpenditureService.createExpenditure(req.body, req.user.id);

    res.status(201).json({
        status: 'success',
        data: { expenditure },
    });
});

/**
 * Get all expenditures
 */
const getAllExpenditures = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(200).json({
            status: 'success',
            items: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
        });
    }

    const result = await ExpenditureService.getAllExpenditures(req.query);

    res.status(200).json({
        status: 'success',
        ...result,
    });
});

/**
 * Get a single expenditure
 */
const getExpenditure = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to view expenditures'
        });
    }

    const expenditure = await ExpenditureService.getExpenditureById(
        req.params.id,
        {
            includeAttachments: req.query.includeAttachments !== 'false',
            includeRetirement: req.query.includeRetirement !== 'false',
        }
    );

    res.status(200).json({
        status: 'success',
        data: { expenditure },
    });
});

/**
 * Update an expenditure
 */
const updateExpenditure = catchAsync(async (req, res) => {
    const expenditure = await ExpenditureService.updateExpenditure(
        req.params.id,
        req.body,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { expenditure },
    });
});

/**
 * Submit expenditure for approval
 */
const submitExpenditure = catchAsync(async (req, res) => {
    const expenditure = await ExpenditureService.submitForApproval(
        req.params.id,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { expenditure },
        message: 'Expenditure submitted for approval successfully',
    });
});

/**
 * Approve an expenditure
 */
const approveExpenditure = catchAsync(async (req, res) => {
    const expenditure = await ExpenditureService.approveExpenditure(
        req.params.id,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { expenditure },
        message: 'Expenditure approved successfully',
    });
});

/**
 * Reject an expenditure
 */
const rejectExpenditure = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const expenditure = await ExpenditureService.rejectExpenditure(
        req.params.id,
        req.user.id,
        reason
    );

    res.status(200).json({
        status: 'success',
        data: { expenditure },
        message: 'Expenditure rejected successfully',
    });
});

/**
 * Delete an expenditure
 */
const deleteExpenditure = catchAsync(async (req, res) => {
    await ExpenditureService.deleteExpenditure(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

/**
 * Get expenditure statistics
 */
const getExpenditureStats = catchAsync(async (req, res) => {
    // Restrict access for Principal and AEO
    if (req.user.role === 'principal' || req.user.role === 'area_education_officer') {
        return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to view expenditure statistics'
        });
    }

    const stats = await ExpenditureService.getExpenditureStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

const createExpenditureCategory = catchAsync(async (req, res) => {
    const category = await ExpenditureCategoryService.createExpenditureCategory(req.body, req.user.id);

    res.status(201).json({
        status: 'success',
        data: { category },
    });
});

const getAllExpenditureCategories = catchAsync(async (req, res) => {
    const result = await ExpenditureCategoryService.getAllExpenditureCategories(req.query);

    res.status(200).json({
        status: 'success',
        ...result,
    });
});

const getExpenditureCategoryById = catchAsync(async (req, res) => {
    const category = await ExpenditureCategoryService.getExpenditureCategoryById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { category },
    });
});

const updateExpenditureCategory = catchAsync(async (req, res) => {
    const category = await ExpenditureCategoryService.updateExpenditureCategory(
        req.params.id,
        req.body,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { category },
    });
});

const deleteExpenditureCategory = catchAsync(async (req, res) => {
    await ExpenditureCategoryService.deleteExpenditureCategory(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});



module.exports = {
    createExpenditure,
    getAllExpenditures,
    getExpenditure,
    updateExpenditure,
    submitExpenditure,
    approveExpenditure,
    rejectExpenditure,
    deleteExpenditure,
    getExpenditureStats,

    // ExpenditureCategories
    createExpenditureCategory,
    getAllExpenditureCategories,
    getExpenditureCategoryById,
    updateExpenditureCategory,
    deleteExpenditureCategory,

};
