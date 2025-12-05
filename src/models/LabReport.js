const mongoose = require('mongoose');

/**
 * Lab Report Schema - Manages test results and reports
 */
const labReportSchema = new mongoose.Schema({
    // Report Identification
    reportId: {
        type: String,
        required: true,
        unique: true
    },

    // Reference Information
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },

    labTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest',
        required: true
    },

    // Sample Information
    sampleId: {
        type: String,
        required: true,
        unique: true
    },

    sampleCollectedAt: {
        type: Date,
        required: true
    },

    sampleCollectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    sampleType: {
        type: String,
        required: true,
        enum: [
            'blood', 'urine', 'stool', 'sputum', 'saliva', 'tissue',
            'csf', 'swab', 'fluid', 'hair', 'nail', 'other'
        ]
    },

    sampleCondition: {
        type: String,
        enum: ['acceptable', 'hemolyzed', 'clotted', 'insufficient', 'contaminated'],
        default: 'acceptable'
    },

    // Processing Information
    processedAt: Date,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    analyzedAt: Date,
    analyzedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Report Status
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'verified', 'rejected', 'cancelled'],
        default: 'pending'
    },

    priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine'
    },

    // Test Results
    results: [{
        parameter: {
            type: String,
            required: true
        },
        value: {
            type: String, // Can be numeric or text
            required: true
        },
        unit: String,
        referenceRange: {
            normal: String,
            critical: String
        },
        flag: {
            type: String,
            enum: ['normal', 'high', 'low', 'critical_high', 'critical_low', 'abnormal'],
            default: 'normal'
        },
        interpretation: String,
        method: String
    }],

    // Clinical Information
    clinicalDiagnosis: String,

    clinicalHistory: String,

    // Quality Control
    qualityControl: {
        controlResults: [{
            controlLevel: String,
            expectedValue: Number,
            actualValue: Number,
            deviation: Number,
            passed: {
                type: Boolean,
                default: true
            }
        }],
        calibration: {
            lastCalibrated: Date,
            calibratedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        instrumentInfo: {
            name: String,
            model: String,
            serialNumber: String
        }
    },

    // Report Verification
    verification: {
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        verificationNotes: String,
        digitalSignature: String
    },

    // AI Analysis
    aiAnalysis: {
        abnormalityDetected: {
            type: Boolean,
            default: false
        },
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        findings: [String],
        recommendations: [String],
        patientEducation: String,
        similarCases: [{
            patientAge: Number,
            similarity: Number,
            outcome: String
        }],
        analysisConfidence: {
            type: Number,
            min: 0,
            max: 100
        },
        lastAnalysis: Date
    },

    // Comments & Notes
    technologistComments: String,

    pathologistComments: String,

    clinicalCorrelation: String,

    additionalNotes: String,

    // Report Files
    reportFiles: [{
        fileName: String,
        fileUrl: String, // Cloudinary URL
        fileType: {
            type: String,
            enum: ['pdf', 'image', 'document']
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Delivery Information
    delivery: {
        method: {
            type: String,
            enum: ['email', 'sms', 'portal', 'physical', 'whatsapp'],
            default: 'portal'
        },
        deliveredAt: Date,
        deliveredTo: String, // email or phone
        downloadedAt: Date,
        downloadCount: {
            type: Number,
            default: 0
        }
    },

    // Critical Value Notification
    criticalValueAlert: {
        hasAlert: {
            type: Boolean,
            default: false
        },
        notifiedAt: Date,
        notifiedPersons: [{
            person: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            method: {
                type: String,
                enum: ['phone', 'email', 'sms']
            },
            notifiedAt: Date,
            acknowledged: {
                type: Boolean,
                default: false
            }
        }]
    },

    // Billing Information
    billing: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        paid: {
            type: Boolean,
            default: false
        },
        paidAt: Date,
        paymentMethod: String,
        invoiceId: String
    },

    // Branch Information
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    // Tracking
    trackingHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],

    // Integration
    lisId: String, // Laboratory Information System ID

    externalReportId: String,

    // Statistics
    stats: {
        processingTime: Number, // in hours
        verificationTime: Number, // in hours
        deliveryTime: Number // in hours
    },

    // System Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
labReportSchema.index({ reportId: 1 });
labReportSchema.index({ sampleId: 1 });
labReportSchema.index({ patient: 1 });
labReportSchema.index({ appointment: 1 });
labReportSchema.index({ labTest: 1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ priority: 1 });
labReportSchema.index({ sampleCollectedAt: 1 });
labReportSchema.index({ branchId: 1 });
labReportSchema.index({ deletedAt: 1 });

// Compound indexes
labReportSchema.index({ patient: 1, status: 1, sampleCollectedAt: -1 });
labReportSchema.index({ status: 1, priority: 1, sampleCollectedAt: 1 });

// Virtual for total processing time
labReportSchema.virtual('totalProcessingTime').get(function () {
    if (this.sampleCollectedAt && this.verifiedAt) {
        return Math.round((this.verifiedAt - this.sampleCollectedAt) / (1000 * 60 * 60)); // in hours
    }
    return null;
});

// Virtual for turnaround time
labReportSchema.virtual('turnaroundTime').get(function () {
    if (this.sampleCollectedAt && this.delivery.deliveredAt) {
        return Math.round((this.delivery.deliveredAt - this.sampleCollectedAt) / (1000 * 60 * 60)); // in hours
    }
    return null;
});

// Method to check if report has critical values
labReportSchema.methods.hasCriticalValues = function () {
    return this.results.some(result =>
        ['critical_high', 'critical_low'].includes(result.flag)
    );
};

// Method to get abnormal results
labReportSchema.methods.getAbnormalResults = function () {
    return this.results.filter(result =>
        ['high', 'low', 'critical_high', 'critical_low', 'abnormal'].includes(result.flag)
    );
};

// Method to check if report is overdue
labReportSchema.methods.isOverdue = function () {
    if (this.status === 'completed' || this.status === 'verified') return false;

    const now = new Date();
    const expectedCompletionTime = new Date(this.sampleCollectedAt);

    // Add processing time from lab test
    if (this.priority === 'stat') {
        expectedCompletionTime.setHours(expectedCompletionTime.getHours() + 2);
    } else if (this.priority === 'urgent') {
        expectedCompletionTime.setHours(expectedCompletionTime.getHours() + 4);
    } else {
        expectedCompletionTime.setDate(expectedCompletionTime.getDate() + 1);
    }

    return now > expectedCompletionTime;
};

// Static method to find reports by date range
labReportSchema.statics.findByDateRange = function (startDate, endDate, filters = {}) {
    const query = {
        sampleCollectedAt: {
            $gte: startDate,
            $lte: endDate
        },
        deletedAt: null,
        ...filters
    };

    return this.find(query)
        .populate('patient', 'firstName lastName phone email')
        .populate('labTest', 'testName testCode category')
        .sort({ sampleCollectedAt: -1 });
};

// Static method to find pending reports
labReportSchema.statics.findPending = function () {
    return this.find({
        status: { $in: ['pending', 'in_progress'] },
        deletedAt: null
    })
        .populate('patient', 'firstName lastName')
        .populate('labTest', 'testName processingTime')
        .sort({ priority: 1, sampleCollectedAt: 1 });
};

// Pre-save middleware to generate report ID and sample ID
labReportSchema.pre('save', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        // Generate Report ID
        const reportCount = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });

        this.reportId = `RPT${year}${month}${day}${(reportCount + 1).toString().padStart(4, '0')}`;

        // Generate Sample ID if not provided
        if (!this.sampleId) {
            this.sampleId = `SMP${year}${month}${day}${(reportCount + 1).toString().padStart(4, '0')}`;
        }
    }
    next();
});

// Post-save middleware to update tracking history
labReportSchema.post('save', async function (doc) {
    if (doc.isModified('status')) {
        doc.trackingHistory.push({
            status: doc.status,
            timestamp: new Date(),
            updatedBy: doc.updatedBy
        });
    }
});

module.exports = mongoose.model('LabReport', labReportSchema);