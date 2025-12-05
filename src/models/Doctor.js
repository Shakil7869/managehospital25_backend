const mongoose = require('mongoose');

/**
 * Doctor Schema - Extends User with doctor-specific information
 */
const doctorSchema = new mongoose.Schema({
    // Reference to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Doctor ID
    doctorId: {
        type: String,
        required: true,
        unique: true
    },

    // Professional Information
    medicalLicense: {
        licenseNumber: {
            type: String,
            required: true,
            unique: true
        },
        issuingState: String,
        issueDate: Date,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['active', 'suspended', 'revoked', 'expired'],
            default: 'active'
        }
    },

    specializations: [{
        name: {
            type: String,
            required: true
        },
        certification: String,
        certificationDate: Date,
        boardCertified: {
            type: Boolean,
            default: false
        }
    }],

    // Education & Training
    education: [{
        institution: {
            type: String,
            required: true
        },
        degree: {
            type: String,
            required: true
        },
        year: Number,
        specialization: String
    }],

    residency: [{
        hospital: String,
        specialization: String,
        startYear: Number,
        endYear: Number
    }],

    fellowship: [{
        institution: String,
        specialization: String,
        year: Number
    }],

    // Practice Information
    consultationFee: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },

    followUpFee: {
        amount: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },

    // Schedule & Availability
    workingHours: {
        monday: {
            isWorking: { type: Boolean, default: true },
            start: String, // "09:00"
            end: String,   // "17:00"
            break: {
                start: String,
                end: String
            }
        },
        tuesday: {
            isWorking: { type: Boolean, default: true },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        },
        wednesday: {
            isWorking: { type: Boolean, default: true },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        },
        thursday: {
            isWorking: { type: Boolean, default: true },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        },
        friday: {
            isWorking: { type: Boolean, default: true },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        },
        saturday: {
            isWorking: { type: Boolean, default: false },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        },
        sunday: {
            isWorking: { type: Boolean, default: false },
            start: String,
            end: String,
            break: {
                start: String,
                end: String
            }
        }
    },

    // Leave & Time Off
    leaves: [{
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        type: {
            type: String,
            enum: ['vacation', 'sick', 'emergency', 'conference', 'other'],
            required: true
        },
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Consultation Preferences
    consultationTypes: [{
        type: String,
        enum: ['in_person', 'video_call', 'phone_call', 'chat']
    }],

    maxPatientsPerDay: {
        type: Number,
        default: 20
    },

    appointmentDuration: {
        type: Number, // in minutes
        default: 30
    },

    // Statistics & Performance
    stats: {
        totalPatients: {
            type: Number,
            default: 0
        },
        totalAppointments: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        cancellationRate: {
            type: Number,
            default: 0
        }
    },

    // Digital Signature
    digitalSignature: {
        signatureUrl: String, // Cloudinary URL
        certificateHash: String,
        isVerified: {
            type: Boolean,
            default: false
        }
    },

    // AI Analysis
    aiInsights: {
        patientSatisfactionPrediction: Number,
        recommendedScheduleOptimization: String,
        riskPatientAlerts: [{
            patientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Patient'
            },
            riskLevel: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            reason: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        lastAnalysis: Date
    },

    // Revenue & Earnings
    earnings: {
        thisMonth: {
            type: Number,
            default: 0
        },
        lastMonth: {
            type: Number,
            default: 0
        },
        thisYear: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        }
    },

    // Professional Status
    isAvailableForAppointments: {
        type: Boolean,
        default: true
    },

    isAcceptingNewPatients: {
        type: Boolean,
        default: true
    },

    // Soft Delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
doctorSchema.index({ 'specializations.name': 1 });
doctorSchema.index({ isAvailableForAppointments: 1 });
doctorSchema.index({ isAcceptingNewPatients: 1 });
doctorSchema.index({ deletedAt: 1 });

// Virtual for years of experience
doctorSchema.virtual('yearsOfExperience').get(function () {
    if (!this.education || this.education.length === 0) return 0;
    const graduationYear = Math.min(...this.education.map(edu => edu.year));
    return new Date().getFullYear() - graduationYear;
});

// Method to check if doctor is available on a specific date/time
doctorSchema.methods.isAvailableAt = function (dateTime) {
    const date = new Date(dateTime);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeString = date.toTimeString().substring(0, 5); // "HH:MM"

    const daySchedule = this.workingHours[dayOfWeek];
    if (!daySchedule || !daySchedule.isWorking) return false;

    // Check if time is within working hours
    if (timeString < daySchedule.start || timeString > daySchedule.end) return false;

    // Check if time is during break
    if (daySchedule.break &&
        timeString >= daySchedule.break.start &&
        timeString <= daySchedule.break.end) {
        return false;
    }

    // Check for leaves
    const isOnLeave = this.leaves.some(leave =>
        leave.status === 'approved' &&
        date >= leave.startDate &&
        date <= leave.endDate
    );

    return !isOnLeave;
};

// Method to get available specializations
doctorSchema.methods.getActiveSpecializations = function () {
    return this.specializations.filter(spec => spec.boardCertified);
};

// Static method to find doctors by specialization
doctorSchema.statics.findBySpecialization = function (specializationName) {
    return this.find({
        'specializations.name': { $regex: specializationName, $options: 'i' },
        isAvailableForAppointments: true,
        deletedAt: null
    }).populate('userId', 'firstName lastName avatar');
};

// Static method to find available doctors
doctorSchema.statics.findAvailable = function () {
    return this.find({
        isAvailableForAppointments: true,
        isAcceptingNewPatients: true,
        deletedAt: null
    }).populate('userId', 'firstName lastName avatar specialization');
};

module.exports = mongoose.model('Doctor', doctorSchema);