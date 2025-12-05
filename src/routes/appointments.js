const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAppointment, handleValidationErrors } = require('../middleware/validation');
const { authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/appointments
 * @desc    Get all appointments with filters
 * @access  Private
 */
router.get('/',
    checkPermission('appointment_read'),
    asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            status,
            doctor,
            patient,
            date,
            branchId,
            consultationType
        } = req.query;

        // Build query
        const query = { deletedAt: null };

        // Apply filters based on user role
        if (req.user.role === 'doctor') {
            query.doctor = req.user._id;
        } else if (req.user.role === 'patient') {
            query.patient = req.user._id;
        } else if (req.user.role !== 'admin' && req.user.branchId) {
            query.branchId = req.user.branchId;
        }

        // Apply additional filters
        if (status) query.status = status;
        if (doctor) query.doctor = doctor;
        if (patient) query.patient = patient;
        if (branchId && req.user.role === 'admin') query.branchId = branchId;
        if (consultationType) query.consultationType = consultationType;

        // Date filter
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.scheduledDate = { $gte: startDate, $lt: endDate };
        }

        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone email avatar')
            .populate('doctor', 'firstName lastName specialization avatar')
            .populate('branchId', 'name code')
            .sort({ scheduledDate: -1, scheduledTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                appointments,
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
 * @route   GET /api/v1/appointments/:id
 * @desc    Get single appointment
 * @access  Private
 */
router.get('/:id',
    checkPermission('appointment_read'),
    asyncHandler(async (req, res) => {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            deletedAt: null
        })
            .populate('patient', 'firstName lastName phone email avatar dateOfBirth gender')
            .populate('doctor', 'firstName lastName specialization avatar contactInfo')
            .populate('branchId', 'name code address contactInfo')
            .populate('createdBy', 'firstName lastName role');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check access permissions
        const hasAccess =
            req.user.role === 'admin' ||
            appointment.patient._id.toString() === req.user._id.toString() ||
            appointment.doctor._id.toString() === req.user._id.toString() ||
            (req.user.branchId && appointment.branchId._id.toString() === req.user.branchId.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: { appointment }
        });
    })
);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post('/',
    checkPermission('appointment_write'),
    validateAppointment,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const appointmentData = {
            ...req.body,
            createdBy: req.user._id
        };

        // If user is patient, set patient field to current user
        if (req.user.role === 'patient') {
            appointmentData.patient = req.user._id;
        }

        // Validate doctor availability
        const doctor = await Doctor.findOne({ userId: req.body.doctor });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        const appointmentDateTime = new Date(`${req.body.scheduledDate} ${req.body.scheduledTime}`);

        if (!doctor.isAvailableAt(appointmentDateTime)) {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not available at the requested time'
            });
        }

        // Check for conflicting appointments
        const conflictingAppointment = await Appointment.findOne({
            doctor: req.body.doctor,
            scheduledDate: req.body.scheduledDate,
            scheduledTime: req.body.scheduledTime,
            status: { $nin: ['cancelled', 'completed'] },
            deletedAt: null
        });

        if (conflictingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'Time slot is already booked'
            });
        }

        // Set consultation fee
        const doctorData = await Doctor.findOne({ userId: req.body.doctor });
        appointmentData.fees = {
            consultationFee: doctorData.consultationFee.amount,
            totalAmount: doctorData.consultationFee.amount
        };

        const appointment = await Appointment.create(appointmentData);

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('patient', 'firstName lastName phone email')
            .populate('doctor', 'firstName lastName specialization')
            .populate('branchId', 'name code');

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: { appointment: populatedAppointment }
        });
    })
);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put('/:id',
    checkPermission('appointment_write'),
    asyncHandler(async (req, res) => {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            deletedAt: null
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check permissions
        const canUpdate =
            req.user.role === 'admin' ||
            appointment.createdBy.toString() === req.user._id.toString() ||
            (req.user.role === 'doctor' && appointment.doctor.toString() === req.user._id.toString()) ||
            (req.user.role === 'receptionist' && req.user.branchId.toString() === appointment.branchId.toString());

        if (!canUpdate) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update appointment
        const updateData = {
            ...req.body,
            updatedBy: req.user._id
        };

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('patient', 'firstName lastName phone email')
            .populate('doctor', 'firstName lastName specialization')
            .populate('branchId', 'name code');

        res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            data: { appointment: updatedAppointment }
        });
    })
);

/**
 * @route   PUT /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private
 */
router.put('/:id/status',
    checkPermission('appointment_write'),
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            deletedAt: null
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Update status and related fields
        const updateData = {
            status,
            updatedBy: req.user._id
        };

        // Set timestamps based on status
        if (status === 'in_progress' && !appointment.actualStartTime) {
            updateData.actualStartTime = new Date();
        } else if (status === 'completed' && !appointment.actualEndTime) {
            updateData.actualEndTime = new Date();
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('patient', 'firstName lastName phone email')
            .populate('doctor', 'firstName lastName specialization');

        res.status(200).json({
            success: true,
            message: 'Appointment status updated successfully',
            data: { appointment: updatedAppointment }
        });
    })
);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Delete appointment (soft delete)
 * @access  Private
 */
router.delete('/:id',
    checkPermission('appointment_delete'),
    asyncHandler(async (req, res) => {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            deletedAt: null
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Soft delete
        appointment.deletedAt = new Date();
        appointment.updatedBy = req.user._id;
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    })
);

/**
 * @route   GET /api/v1/appointments/doctor/:doctorId/schedule
 * @desc    Get doctor's schedule for a specific date
 * @access  Private
 */
router.get('/doctor/:doctorId/schedule',
    checkPermission('appointment_read'),
    asyncHandler(async (req, res) => {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        const schedule = await Appointment.findDoctorDaySchedule(req.params.doctorId, date);

        res.status(200).json({
            success: true,
            data: { schedule }
        });
    })
);

module.exports = router;