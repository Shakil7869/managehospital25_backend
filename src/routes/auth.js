const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
    validateUserRegistration,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        console.log('📥 [Backend] Register request received');
        console.log('📥 [Backend] Request body:', JSON.stringify(req.body, null, 2));
        
        const { firstName, lastName, email, phone, password, role, branchId, firebaseUid } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { firebaseUid: firebaseUid || null }]
        });

        if (existingUser) {
            console.log('⚠️ [Backend] User already exists with email:', email);
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        console.log('✅ [Backend] User does not exist, proceeding with registration');

        // Validate or find default branch
        let validBranchId = branchId;

        if (!validBranchId || !mongoose.Types.ObjectId.isValid(validBranchId)) {
            console.log('🔵 [Backend] Invalid branchId, finding or creating default branch');
            // Try to find any existing branch or create a default one
            let branch = await Branch.findOne().sort({ createdAt: 1 });

            if (!branch) {
                console.log('🔵 [Backend] No branch found, creating default branch');
                // Create a default branch if none exists
                branch = await Branch.create({
                    branchId: 'BR001',
                    name: 'Main Branch',
                    code: 'MAIN',
                    type: 'hospital',
                    contactInfo: {
                        phone: '+1234567890',
                        email: 'info@hospital.com'
                    },
                    address: {
                        street: 'Main Street',
                        city: 'City',
                        state: 'State',
                        zipCode: '00000',
                        country: 'Country'
                    }
                });
                console.log('✅ [Backend] Default branch created:', branch._id);
            } else {
                console.log('✅ [Backend] Found existing branch:', branch._id);
            }

            validBranchId = branch._id;
        }

        console.log('🔵 [Backend] Creating user with branchId:', validBranchId);
        
        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            password,
            role,
            branchId: validBranchId,
            firebaseUid,
            permissions: getDefaultPermissions(role)
        });

        console.log('✅ [Backend] User created successfully:', user._id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        console.log('✅ [Backend] JWT token generated');
        console.log('📤 [Backend] Sending success response');

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    branchId: user.branchId
                },
                token
            }
        });
    })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
    validateUserLogin,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Find user and include password for validation
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordCorrect = await user.correctPassword(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive || user.deletedAt) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    branchId: user.branchId,
                    avatar: user.avatar
                },
                token
            }
        });
    })
);

/**
 * @route   POST /api/v1/auth/firebase-login
 * @desc    Login with Firebase token
 * @access  Public
 */
router.post('/firebase-login',
    asyncHandler(async (req, res) => {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Firebase ID token is required'
            });
        }

        try {
            // Verify Firebase token
            const decodedToken = await admin.auth().verifyIdToken(idToken);

            // Find user by Firebase UID
            let user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }

            // Check if user is active
            if (!user.isActive || user.deletedAt) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '30d' }
            );

            res.status(200).json({
                success: true,
                message: 'Firebase login successful',
                data: {
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        branchId: user.branchId,
                        avatar: user.avatar
                    },
                    token
                }
            });

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Firebase token'
            });
        }
    })
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
    asyncHandler(async (req, res) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // In a real application, you would send this token via email
        // For now, we'll return it in the response
        res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            resetToken // In production, this should be sent via email
        });
    })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post('/reset-password',
    asyncHandler(async (req, res) => {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        try {
            const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Password reset successful'
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
    })
);

/**
 * Helper function to get default permissions based on role
 */
function getDefaultPermissions(role) {
    const permissions = {
        patient: ['patient_read'],
        doctor: [
            'patient_read', 'patient_write',
            'appointment_read', 'appointment_write',
            'lab_read', 'lab_write'
        ],
        receptionist: [
            'patient_read', 'patient_write',
            'appointment_read', 'appointment_write',
            'billing_read', 'billing_write'
        ],
        lab_technician: [
            'patient_read',
            'lab_read', 'lab_write',
            'inventory_read'
        ],
        admin: [
            'patient_read', 'patient_write', 'patient_delete',
            'appointment_read', 'appointment_write', 'appointment_delete',
            'doctor_read', 'doctor_write', 'doctor_delete',
            'lab_read', 'lab_write', 'lab_delete',
            'billing_read', 'billing_write', 'billing_delete',
            'inventory_read', 'inventory_write', 'inventory_delete',
            'staff_read', 'staff_write', 'staff_delete',
            'analytics_read', 'admin_access'
        ]
    };

    return permissions[role] || ['patient_read'];
}

module.exports = router;