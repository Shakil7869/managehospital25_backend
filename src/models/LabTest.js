const mongoose = require('mongoose');

/**
 * Lab Test Schema - Manages all laboratory tests and diagnostics
 */
const labTestSchema = new mongoose.Schema({
    // Test Identification
    testId: {
        type: String,
        required: true,
        unique: true
    },

    testName: {
        type: String,
        required: true,
        trim: true
    },

    testCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    // Test Categories
    category: {
        type: String,
        required: true,
        enum: [
            'hematology', 'biochemistry', 'microbiology', 'pathology',
            'radiology', 'cardiology', 'neurology', 'endocrinology',
            'immunology', 'genetics', 'toxicology', 'cytology'
        ]
    },

    subcategory: String,

    // Test Details
    description: {
        type: String,
        maxlength: 1000
    },

    methodology: String,

    sampleType: {
        type: String,
        required: true,
        enum: [
            'blood', 'urine', 'stool', 'sputum', 'saliva', 'tissue',
            'csf', 'swab', 'fluid', 'hair', 'nail', 'other'
        ]
    },

    sampleVolume: {
        amount: Number,
        unit: {
            type: String,
            enum: ['ml', 'cc', 'drops', 'grams']
        }
    },

    // Container & Collection
    containerType: {
        type: String,
        enum: ['plain_tube', 'edta_tube', 'fluoride_tube', 'citrate_tube', 'heparin_tube', 'container', 'sterile_container']
    },

    collectionInstructions: {
        type: String,
        maxlength: 500
    },

    // Patient Preparation
    preparationInstructions: [{
        instruction: {
            type: String,
            required: true
        },
        timeframe: String, // "12 hours before", "night before"
        importance: {
            type: String,
            enum: ['required', 'recommended', 'optional'],
            default: 'required'
        }
    }],

    fastingRequired: {
        type: Boolean,
        default: false
    },

    fastingHours: {
        type: Number,
        default: 0
    },

    // Timing & Processing
    processingTime: {
        duration: {
            type: Number,
            required: true // in hours
        },
        unit: {
            type: String,
            enum: ['hours', 'days'],
            default: 'hours'
        }
    },

    urgentProcessingTime: {
        duration: Number, // in hours
        unit: {
            type: String,
            enum: ['minutes', 'hours'],
            default: 'hours'
        }
    },

    // Reference Values
    referenceRanges: [{
        parameter: {
            type: String,
            required: true
        },
        unit: String,
        normalRange: {
            male: {
                min: Number,
                max: Number,
                text: String
            },
            female: {
                min: Number,
                max: Number,
                text: String
            },
            pediatric: {
                ageGroup: String, // "0-1 years", "1-5 years"
                min: Number,
                max: Number,
                text: String
            }
        },
        criticalValues: {
            low: Number,
            high: Number
        }
    }],

    // Pricing
    pricing: {
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },
        urgentPrice: Number,
        homeCollectionPrice: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        discounts: [{
            type: {
                type: String,
                enum: ['percentage', 'fixed']
            },
            value: Number,
            applicableFor: String, // "senior_citizens", "students", etc.
            validUntil: Date
        }]
    },

    // Availability
    isActive: {
        type: Boolean,
        default: true
    },

    isUrgentAvailable: {
        type: Boolean,
        default: true
    },

    isHomeCollectionAvailable: {
        type: Boolean,
        default: false
    },

    // Equipment & Resources
    requiredEquipment: [String],

    requiredReagents: [{
        name: String,
        quantity: Number,
        unit: String
    }],

    // Quality Control
    qualityControlParameters: [{
        parameter: String,
        acceptableRange: {
            min: Number,
            max: Number
        },
        frequency: String // "daily", "weekly"
    }],

    // Clinical Information
    clinicalSignificance: {
        type: String,
        maxlength: 1000
    },

    indications: [String],

    contraindications: [String],

    interferingFactors: [String],

    // Department & Lab
    department: {
        type: String,
        required: true,
        enum: ['pathology', 'microbiology', 'radiology', 'cardiology']
    },

    labSection: String,

    // Integration
    lisCode: String, // Laboratory Information System code

    machineCode: String, // Analyzer machine code

    // Statistics
    stats: {
        totalOrders: {
            type: Number,
            default: 0
        },
        averageProcessingTime: Number, // in hours
        abnormalResultsPercentage: Number,
        popularityScore: {
            type: Number,
            default: 0
        }
    },

    // AI Insights
    aiInsights: {
        predictedDemand: Number,
        seasonalTrends: [String],
        commonCombinations: [String], // other tests commonly ordered together
        lastAnalysis: Date
    },

    // Branch Availability
    branches: [{
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch'
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        processingTime: Number,
        price: Number
    }],

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
labTestSchema.index({ testName: 'text' });
labTestSchema.index({ category: 1 });
labTestSchema.index({ sampleType: 1 });
labTestSchema.index({ isActive: 1 });
labTestSchema.index({ department: 1 });
labTestSchema.index({ 'pricing.basePrice': 1 });
labTestSchema.index({ deletedAt: 1 });

// Virtual for estimated processing time in business hours
labTestSchema.virtual('estimatedProcessingDays').get(function () {
    if (this.processingTime.unit === 'hours') {
        return Math.ceil(this.processingTime.duration / 8); // 8 hour work day
    }
    return this.processingTime.duration;
});

// Method to get reference range for specific demographics
labTestSchema.methods.getReferenceRange = function (parameter, gender, age) {
    const range = this.referenceRanges.find(r => r.parameter === parameter);
    if (!range) return null;

    // Check pediatric first
    if (age < 18) {
        const pediatricRange = range.normalRange.pediatric;
        if (pediatricRange) return pediatricRange;
    }

    // Return gender-specific range
    return range.normalRange[gender] || range.normalRange.male;
};

// Method to check if result is critical
labTestSchema.methods.isCriticalValue = function (parameter, value) {
    const range = this.referenceRanges.find(r => r.parameter === parameter);
    if (!range || !range.criticalValues) return false;

    return value < range.criticalValues.low || value > range.criticalValues.high;
};

// Method to get effective price for branch
labTestSchema.methods.getPrice = function (branchId, isUrgent = false, isHomeCollection = false) {
    let price = this.pricing.basePrice;

    // Check branch-specific pricing
    const branchConfig = this.branches.find(b => b.branchId.toString() === branchId.toString());
    if (branchConfig && branchConfig.price) {
        price = branchConfig.price;
    }

    // Add urgent charges
    if (isUrgent && this.pricing.urgentPrice) {
        price += this.pricing.urgentPrice;
    }

    // Add home collection charges
    if (isHomeCollection && this.pricing.homeCollectionPrice) {
        price += this.pricing.homeCollectionPrice;
    }

    return price;
};

// Static method to search tests
labTestSchema.statics.searchTests = function (query, filters = {}) {
    const searchQuery = {
        $and: [
            {
                $or: [
                    { testName: { $regex: query, $options: 'i' } },
                    { testCode: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            },
            { isActive: true },
            { deletedAt: null },
            ...Object.entries(filters).map(([key, value]) => ({ [key]: value }))
        ]
    };

    return this.find(searchQuery)
        .select('testId testName testCode category sampleType pricing processingTime')
        .sort({ 'stats.popularityScore': -1 });
};

// Static method to find tests by category
labTestSchema.statics.findByCategory = function (category, subcategory = null) {
    const query = {
        category: category,
        isActive: true,
        deletedAt: null
    };

    if (subcategory) {
        query.subcategory = subcategory;
    }

    return this.find(query).sort({ testName: 1 });
};

// Pre-save middleware to generate test ID
labTestSchema.pre('save', async function (next) {
    if (this.isNew) {
        const categoryCode = this.category.substring(0, 3).toUpperCase();
        const count = await this.constructor.countDocuments({ category: this.category });
        this.testId = `${categoryCode}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('LabTest', labTestSchema);