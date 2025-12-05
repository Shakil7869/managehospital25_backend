const mongoose = require('mongoose');

/**
 * Appointment Schema - Manages all appointments in the system
 */
const appointmentSchema = new mongoose.Schema({
    // Appointment ID
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },

    // Participants
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Scheduling Information
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String, // "14:30"
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },

    // Appointment Details
    type: {
        type: String,
        enum: ['consultation', 'follow_up', 'emergency', 'surgery', 'procedure', 'check_up'],
        required: true,
        default: 'consultation'
    },

    consultationType: {
        type: String,
        enum: ['in_person', 'video_call', 'phone_call', 'chat'],
        required: true,
        default: 'in_person'
    },

    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Status Management
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
        default: 'scheduled'
    },

    // Reason for Visit
    chiefComplaint: {
        type: String,
        required: true,
        maxlength: 500
    },
    symptoms: [String],
    notes: {
        type: String,
        maxlength: 1000
    },

    // Queue Management
    tokenNumber: {
        type: String,
        sparse: true
    },
    estimatedWaitTime: {
        type: Number, // in minutes
        default: 0
    },
    queuePosition: {
        type: Number,
        default: 0
    },

    // Check-in/Check-out
    checkedInAt: Date,
    checkedOutAt: Date,
    actualStartTime: Date,
    actualEndTime: Date,

    // Cancellation/Rescheduling
    cancellation: {
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancelledAt: Date,
        reason: String,
        refundAmount: {
            type: Number,
            default: 0
        }
    },

    rescheduling: {
        rescheduledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rescheduledAt: Date,
        previousDate: Date,
        previousTime: String,
        reason: String
    },

    // Financial Information
    fees: {
        consultationFee: {
            type: Number,
            required: true,
            min: 0
        },
        additionalCharges: [{
            description: String,
            amount: Number
        }],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid', 'refunded'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'insurance', 'online', 'upi']
        }
    },

    // Insurance
    insurance: {
        isInsuranceCovered: {
            type: Boolean,
            default: false
        },
        provider: String,
        policyNumber: String,
        approvalNumber: String,
        coveredAmount: {
            type: Number,
            default: 0
        }
    },

    // Clinical Data
    vitals: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        temperature: {
            value: Number,
            unit: {
                type: String,
                enum: ['C', 'F'],
                default: 'C'
            }
        },
        weight: {
            value: Number,
            unit: {
                type: String,
                enum: ['kg', 'lbs'],
                default: 'kg'
            }
        },
        height: {
            value: Number,
            unit: {
                type: String,
                enum: ['cm', 'ft'],
                default: 'cm'
            }
        },
        oxygenSaturation: Number,
        respiratoryRate: Number,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        recordedAt: Date
    },

    // Diagnosis & Treatment
    diagnosis: [{
        condition: {
            type: String,
            required: true
        },
        icdCode: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'mild'
        },
        notes: String
    }],

    treatment: [{
        procedure: String,
        medication: String,
        dosage: String,
        duration: String,
        instructions: String
    }],

    // Prescriptions
    prescriptions: [{
        medicationName: {
            type: String,
            required: true
        },
        dosage: String,
        frequency: String,
        duration: String,
        quantity: Number,
        instructions: String,
        refills: {
            type: Number,
            default: 0
        }
    }],

    // Lab Tests & Investigations
    labTests: [{
        testName: {
            type: String,
            required: true
        },
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabTest'
        },
        urgency: {
            type: String,
            enum: ['routine', 'urgent', 'stat'],
            default: 'routine'
        },
        instructions: String,
        ordered: {
            type: Boolean,
            default: false
        },
        orderedAt: Date
    }],

    // Follow-up
    followUp: {
        isRequired: {
            type: Boolean,
            default: false
        },
        scheduledDate: Date,
        instructions: String,
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    },

    // Documents & Files
    documents: [{
        name: String,
        url: String, // Cloudinary URL
        type: {
            type: String,
            enum: ['prescription', 'lab_report', 'image', 'document']
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Reminders & Notifications
    reminders: [{
        type: {
            type: String,
            enum: ['appointment_reminder', 'medication_reminder', 'follow_up_reminder']
        },
        scheduledAt: Date,
        sent: {
            type: Boolean,
            default: false
        },
        sentAt: Date
    }],

    // AI Insights
    aiInsights: {
        riskAssessment: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            factors: [String],
            recommendations: [String]
        },
        predictedDuration: Number,
        similarCases: [{
            appointmentId: String,
            similarity: Number
        }],
        lastAnalysis: Date
    },

    // Branch Information
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    // Room/Location
    roomNumber: String,

    // Feedback & Rating
    feedback: {
        patientRating: {
            type: Number,
            min: 1,
            max: 5
        },
        patientReview: String,
        doctorRating: {
            type: Number,
            min: 1,
            max: 5
        },
        doctorReview: String,
        overallSatisfaction: {
            type: Number,
            min: 1,
            max: 5
        },
        submittedAt: Date
    },

    // System Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ branchId: 1 });
appointmentSchema.index({ deletedAt: 1 });
appointmentSchema.index({ 'fees.paymentStatus': 1 });

// Compound indexes
appointmentSchema.index({ doctor: 1, scheduledDate: 1, status: 1 });
appointmentSchema.index({ patient: 1, status: 1, scheduledDate: -1 });

// Virtual for appointment date/time
appointmentSchema.virtual('appointmentDateTime').get(function () {
    const date = new Date(this.scheduledDate);
    const [hours, minutes] = this.scheduledTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
});

// Virtual for total duration including actual time
appointmentSchema.virtual('actualDuration').get(function () {
    if (this.actualStartTime && this.actualEndTime) {
        return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
    }
    return this.duration;
});

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function () {
    return this.appointmentDateTime > new Date() &&
        ['scheduled', 'confirmed'].includes(this.status);
};

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function () {
    const now = new Date();
    const appointmentTime = this.appointmentDateTime;
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    return hoursUntilAppointment >= 24 &&
        ['scheduled', 'confirmed'].includes(this.status);
};

// Method to calculate waiting time
appointmentSchema.methods.calculateWaitingTime = function () {
    if (this.checkedInAt && this.actualStartTime) {
        return Math.round((this.actualStartTime - this.checkedInAt) / (1000 * 60)); // in minutes
    }
    return this.estimatedWaitTime;
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function (startDate, endDate, filters = {}) {
    const query = {
        scheduledDate: {
            $gte: startDate,
            $lte: endDate
        },
        deletedAt: null,
        ...filters
    };

    return this.find(query)
        .populate('patient', 'firstName lastName phone email')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ scheduledDate: 1, scheduledTime: 1 });
};

// Static method to find doctor's appointments for a day
appointmentSchema.statics.findDoctorDaySchedule = function (doctorId, date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.find({
        doctor: doctorId,
        scheduledDate: {
            $gte: startDate,
            $lte: endDate
        },
        status: { $in: ['scheduled', 'confirmed', 'in_progress', 'completed'] },
        deletedAt: null
    }).populate('patient', 'firstName lastName phone')
        .sort({ scheduledTime: 1 });
};

// Pre-save middleware to generate appointment ID
appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });

        this.appointmentId = `APT${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);