const mongoose = require('mongoose');

/**
 * Patient Schema - Extends User with patient-specific information
 */
const patientSchema = new mongoose.Schema({
    // Reference to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Patient ID
    patientId: {
        type: String,
        required: true,
        unique: true
    },

    // Medical Information
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: false
    },
    height: {
        value: Number,
        unit: {
            type: String,
            enum: ['cm', 'ft'],
            default: 'cm'
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

    // Medical History
    allergies: [{
        allergen: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'mild'
        },
        reaction: String,
        diagnosedDate: Date
    }],

    chronicConditions: [{
        condition: {
            type: String,
            required: true
        },
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'controlled', 'resolved'],
            default: 'active'
        },
        medications: [String]
    }],

    currentMedications: [{
        name: {
            type: String,
            required: true
        },
        dosage: String,
        frequency: String,
        prescribedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        startDate: Date,
        endDate: Date,
        notes: String
    }],

    surgicalHistory: [{
        procedure: {
            type: String,
            required: true
        },
        date: Date,
        hospital: String,
        surgeon: String,
        complications: String,
        notes: String
    }],

    familyHistory: [{
        relation: {
            type: String,
            required: true
        },
        condition: {
            type: String,
            required: true
        },
        ageOfOnset: Number,
        status: {
            type: String,
            enum: ['living', 'deceased'],
            default: 'living'
        }
    }],

    // Insurance Information
    insurance: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
        expiryDate: Date,
        copayAmount: Number,
        deductible: Number
    },

    // Primary Care Provider
    primaryDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Vital Signs (latest)
    vitals: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number,
            recordedAt: Date
        },
        heartRate: {
            rate: Number,
            recordedAt: Date
        },
        temperature: {
            value: Number,
            unit: {
                type: String,
                enum: ['C', 'F'],
                default: 'C'
            },
            recordedAt: Date
        },
        respiratoryRate: {
            rate: Number,
            recordedAt: Date
        },
        oxygenSaturation: {
            value: Number,
            recordedAt: Date
        }
    },

    // AI Risk Assessment
    aiRiskProfile: {
        overallRisk: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        riskFactors: [String],
        lastAssessment: Date,
        nextRecommendedCheckup: Date
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
patientSchema.index({ primaryDoctor: 1 });
patientSchema.index({ deletedAt: 1 });
patientSchema.index({ 'insurance.provider': 1 });

// Virtual for BMI
patientSchema.virtual('bmi').get(function () {
    if (!this.height?.value || !this.weight?.value) return null;

    let heightInM = this.height.value;
    if (this.height.unit === 'ft') {
        heightInM = heightInM * 0.3048;
    } else if (this.height.unit === 'cm') {
        heightInM = heightInM / 100;
    }

    let weightInKg = this.weight.value;
    if (this.weight.unit === 'lbs') {
        weightInKg = weightInKg * 0.453592;
    }

    return (weightInKg / (heightInM * heightInM)).toFixed(2);
});

// Method to check if patient has active allergies
patientSchema.methods.hasAllergies = function () {
    return this.allergies && this.allergies.length > 0;
};

// Method to get current medications
patientSchema.methods.getCurrentMedications = function () {
    const now = new Date();
    return this.currentMedications.filter(med =>
        !med.endDate || med.endDate > now
    );
};

// Static method to find patients by doctor
patientSchema.statics.findByDoctor = function (doctorId) {
    return this.find({
        primaryDoctor: doctorId,
        deletedAt: null
    }).populate('userId', 'firstName lastName email phone avatar');
};

module.exports = mongoose.model('Patient', patientSchema);