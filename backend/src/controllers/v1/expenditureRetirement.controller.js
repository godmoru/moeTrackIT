const ExpenditureRetirementService = require('../../services/v1/expenditureRetirement.service.js');
const catchAsync = require('../../utils/catchAsync.js');

/**
 * Create a new retirement
 */
const createRetirement = catchAsync(async (req, res) => {
    const retirement = await ExpenditureRetirementService.createRetirement(req.body, req.user.id);

    res.status(201).json({
        status: 'success',
        data: { retirement },
    });
});

/**
 * Get all retirements
 */
const getAllRetirements = catchAsync(async (req, res) => {
    const result = await ExpenditureRetirementService.getAllRetirements(req.query);

    res.status(200).json({
        status: 'success',
        ...result,
    });
});

/**
 * Get a single retirement
 */
const getRetirement = catchAsync(async (req, res) => {
    const retirement = await ExpenditureRetirementService.getRetirementById(
        req.params.id,
        { includeAttachments: req.query.includeAttachments !== 'false' }
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
    });
});

/**
 * Update a retirement
 */
const updateRetirement = catchAsync(async (req, res) => {
    const retirement = await ExpenditureRetirementService.updateRetirement(
        req.params.id,
        req.body,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
    });
});

/**
 * Submit retirement for review
 */
const submitRetirement = catchAsync(async (req, res) => {
    const retirement = await ExpenditureRetirementService.submitRetirement(
        req.params.id,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
        message: 'Retirement submitted for review successfully',
    });
});

/**
 * Review a retirement
 */
const reviewRetirement = catchAsync(async (req, res) => {
    const { status, remarks } = req.body;
    const retirement = await ExpenditureRetirementService.reviewRetirement(
        req.params.id,
        req.user.id,
        status,
        remarks
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
        message: 'Retirement reviewed successfully',
    });
});

/**
 * Approve a retirement
 */
const approveRetirement = catchAsync(async (req, res) => {
    const retirement = await ExpenditureRetirementService.approveRetirement(
        req.params.id,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
        message: 'Retirement approved successfully',
    });
});

/**
 * Reject a retirement
 */
const rejectRetirement = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const retirement = await ExpenditureRetirementService.rejectRetirement(
        req.params.id,
        req.user.id,
        reason
    );

    res.status(200).json({
        status: 'success',
        data: { retirement },
        message: 'Retirement rejected successfully',
    });
});

/**
 * Get retirement statistics
 */
const getRetirementStats = catchAsync(async (req, res) => {
    const stats = await ExpenditureRetirementService.getRetirementStats(req.query);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

module.exports = {
    createRetirement,
    getAllRetirements,
    getRetirement,
    updateRetirement,
    submitRetirement,
    reviewRetirement,
    approveRetirement,
    rejectRetirement,
    getRetirementStats,
};
