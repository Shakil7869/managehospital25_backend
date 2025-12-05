const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Base schema for all users in the system
 * Supports: Patient, Doctor, Admin, Receptionist, Lab Technician
 */
const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
        maxlength: 50,
        default: null
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },

    // Authentication
    password: {
        type: String,
        required: function () {
            return !this.firebaseUid; // Password required if not using Firebase
        },
        minlength: 6
    },
    firebaseUid: {
        type: String,
        sparse: true,
        unique: true
    },

    // Role & Permissions
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin', 'receptionist', 'lab_technician'],
        required: true,
        default: 'patient'
    },
    permissions: [{
        type: String,
        enum: [
            'patient_read', 'patient_write', 'patient_delete',
            'appointment_read', 'appointment_write', 'appointment_delete',
            'doctor_read', 'doctor_write', 'doctor_delete',
            'lab_read', 'lab_write', 'lab_delete',
            'billing_read', 'billing_write', 'billing_delete',
            'inventory_read', 'inventory_write', 'inventory_delete',
            'staff_read', 'staff_write', 'staff_delete',
            'analytics_read', 'admin_access'
        ]
    }],

    // Profile Information
    avatar: {
        type: String, // Cloudinary URL
        default: null
    },
    dateOfBirth: {
        type: Date,
        required: function () {
            return this.role === 'patient';
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: function () {
            return this.role === 'patient';
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'USA'
        }
    },

    // Emergency Contact (for patients)
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },

    // Professional Information (for staff)
    employeeId: {
        type: String,
        sparse: true,
        unique: true
    },
    department: {
        type: String,
        enum: ['general', 'cardiology', 'neurology', 'pediatrics', 'orthopedics', 'dermatology', 'psychiatry', 'laboratory', 'administration']
    },
    specialization: String,
    licenseNumber: String,
    experience: Number, // Years of experience

    // Branch & Organization
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,

    // FCM Token for push notifications
    fcmTokens: [{
        token: String,
        deviceType: {
            type: String,
            enum: ['android', 'ios', 'web']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Preferences
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },

    // Soft Delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age (for patients)
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

// Method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if user has permission
userSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission);
};

// Static method to find active users
userSchema.statics.findActive = function () {
    return this.find({ deletedAt: null, isActive: true });
};

module.exports = mongoose.model('User', userSchema);