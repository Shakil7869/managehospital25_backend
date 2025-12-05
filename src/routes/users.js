const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id)
            .populate('branchId', 'name code address');

        res.status(200).json({
            success: true,
            data: { user }
        });
    })
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
    asyncHandler(async (req, res) => {
        const allowedFields = [
            'firstName', 'lastName', 'phone', 'address',
            'avatar', 'preferences', 'emergencyContact'
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).populate('branchId', 'name code');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    })
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/',
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, role, branchId, search } = req.query;

        const query = { deletedAt: null };

        if (role) query.role = role;
        if (branchId) query.branchId = branchId;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .populate('branchId', 'name code')
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    })
);

module.exports = router;