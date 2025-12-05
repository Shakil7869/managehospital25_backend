const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients
 * @access  Private
 */
router.get('/',
    checkPermission('patient_read'),
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, search, branchId } = req.query;

        let userQuery = {
            role: 'patient',
            deletedAt: null
        };

        // Branch filtering for non-admin users
        if (req.user.role !== 'admin' && req.user.branchId) {
            userQuery.branchId = req.user.branchId;
        } else if (branchId) {
            userQuery.branchId = branchId;
        }

        // Search functionality
        if (search) {
            userQuery.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(userQuery)
            .populate('branchId', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get patient details for each user
        const userIds = users.map(user => user._id);
        const patients = await Patient.find({
            userId: { $in: userIds },
            deletedAt: null
        }).populate('primaryDoctor', 'firstName lastName');

        // Merge user and patient data
        const patientsData = users.map(user => {
            const patientInfo = patients.find(p => p.userId.toString() === user._id.toString());
            return {
                ...user.toObject(),
                patientInfo
            };
        });

        const total = await User.countDocuments(userQuery);

        res.status(200).json({
            success: true,
            data: {
                patients: patientsData,
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

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get single patient
 * @access  Private
 */
router.get('/:id',
    checkPermission('patient_read'),
    asyncHandler(async (req, res) => {
        const user = await User.findOne({
            _id: req.params.id,
            role: 'patient',
            deletedAt: null
        }).populate('branchId', 'name code address');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const patient = await Patient.findOne({
            userId: req.params.id,
            deletedAt: null
        }).populate('primaryDoctor', 'firstName lastName specialization');

        res.status(200).json({
            success: true,
            data: {
                patient: {
                    ...user.toObject(),
                    patientInfo: patient
                }
            }
        });
    })
);

/**
 * @route   POST /api/v1/patients
 * @desc    Create new patient
 * @access  Private
 */
router.post('/',
    checkPermission('patient_write'),
    asyncHandler(async (req, res) => {
        const {
            firstName, lastName, email, phone, dateOfBirth, gender,
            address, emergencyContact, bloodType, height, weight,
            allergies, chronicConditions, insurance, primaryDoctor
        } = req.body;

        // Create user account
        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContact,
            role: 'patient',
            branchId: req.user.branchId,
            permissions: ['patient_read']
        });

        // Generate patient ID
        const patientCount = await Patient.countDocuments();
        const patientId = `PAT${(patientCount + 1).toString().padStart(6, '0')}`;

        // Create patient profile
        const patient = await Patient.create({
            userId: user._id,
            patientId,
            bloodType,
            height,
            weight,
            allergies: allergies || [],
            chronicConditions: chronicConditions || [],
            insurance,
            primaryDoctor
        });

        const populatedPatient = await Patient.findById(patient._id)
            .populate('userId', '-password')
            .populate('primaryDoctor', 'firstName lastName specialization');

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            data: { patient: populatedPatient }
        });
    })
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient
 * @access  Private
 */
router.put('/:id',
    checkPermission('patient_write'),
    asyncHandler(async (req, res) => {
        const user = await User.findOne({
            _id: req.params.id,
            role: 'patient',
            deletedAt: null
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Update user data
        const userFields = [
            'firstName', 'lastName', 'phone', 'address',
            'emergencyContact', 'preferences'
        ];

        const userUpdateData = {};
        userFields.forEach(field => {
            if (req.body[field] !== undefined) {
                userUpdateData[field] = req.body[field];
            }
        });

        if (Object.keys(userUpdateData).length > 0) {
            await User.findByIdAndUpdate(req.params.id, userUpdateData);
        }

        // Update patient data
        const patientFields = [
            'bloodType', 'height', 'weight', 'allergies',
            'chronicConditions', 'currentMedications', 'insurance',
            'primaryDoctor', 'vitals'
        ];

        const patientUpdateData = {};
        patientFields.forEach(field => {
            if (req.body[field] !== undefined) {
                patientUpdateData[field] = req.body[field];
            }
        });

        let patient = await Patient.findOne({ userId: req.params.id });

        if (patient && Object.keys(patientUpdateData).length > 0) {
            patient = await Patient.findByIdAndUpdate(
                patient._id,
                patientUpdateData,
                { new: true }
            );
        }

        const updatedUser = await User.findById(req.params.id)
            .populate('branchId', 'name code');

        const updatedPatient = await Patient.findOne({ userId: req.params.id })
            .populate('primaryDoctor', 'firstName lastName specialization');

        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: {
                patient: {
                    ...updatedUser.toObject(),
                    patientInfo: updatedPatient
                }
            }
        });
    })
);

module.exports = router;