const mongoose = require('mongoose');

/**
 * Branch Schema - Manages multi-branch healthcare facilities
 */
const branchSchema = new mongoose.Schema({
    // Branch Identification
    branchId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    // Branch Type
    type: {
        type: String,
        enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'laboratory'],
        required: true
    },

    // Contact Information
    contactInfo: {
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        website: String,
        fax: String
    },

    // Address
    address: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'USA'
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },

    // Operating Hours
    operatingHours: {
        monday: {
            isOpen: { type: Boolean, default: true },
            openTime: String, // "08:00"
            closeTime: String, // "20:00"
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        tuesday: {
            isOpen: { type: Boolean, default: true },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        wednesday: {
            isOpen: { type: Boolean, default: true },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        thursday: {
            isOpen: { type: Boolean, default: true },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        friday: {
            isOpen: { type: Boolean, default: true },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        saturday: {
            isOpen: { type: Boolean, default: true },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        },
        sunday: {
            isOpen: { type: Boolean, default: false },
            openTime: String,
            closeTime: String,
            breaks: [{
                startTime: String,
                endTime: String,
                description: String
            }]
        }
    },

    // Emergency Services
    emergencyServices: {
        isAvailable: {
            type: Boolean,
            default: false
        },
        phone: String,
        is24x7: {
            type: Boolean,
            default: false
        }
    },

    // Services Offered
    services: [{
        name: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['consultation', 'diagnostic', 'surgical', 'emergency', 'pharmacy', 'laboratory']
        },
        isActive: {
            type: Boolean,
            default: true
        },
        pricing: {
            basePrice: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        }
    }],

    // Departments
    departments: [{
        name: {
            type: String,
            required: true
        },
        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        location: {
            floor: String,
            wing: String,
            roomNumbers: [String]
        }
    }],

    // Facilities & Equipment
    facilities: {
        totalBeds: {
            type: Number,
            default: 0
        },
        icuBeds: {
            type: Number,
            default: 0
        },
        operationTheaters: {
            type: Number,
            default: 0
        },
        consultationRooms: {
            type: Number,
            default: 0
        },
        parkingSpaces: {
            type: Number,
            default: 0
        },
        wheelchairAccessible: {
            type: Boolean,
            default: true
        },
        pharmacy: {
            type: Boolean,
            default: false
        },
        laboratory: {
            type: Boolean,
            default: false
        },
        radiology: {
            type: Boolean,
            default: false
        },
        cafeteria: {
            type: Boolean,
            default: false
        }
    },

    // Staff Information
    staff: {
        totalStaff: {
            type: Number,
            default: 0
        },
        doctors: {
            type: Number,
            default: 0
        },
        nurses: {
            type: Number,
            default: 0
        },
        technicians: {
            type: Number,
            default: 0
        },
        administrators: {
            type: Number,
            default: 0
        }
    },

    // Branch Manager
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Licensing & Certification
    licenses: [{
        type: {
            type: String,
            enum: ['medical_license', 'business_license', 'fire_safety', 'health_permit', 'other']
        },
        number: String,
        issuingAuthority: String,
        issueDate: Date,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['active', 'expired', 'suspended', 'pending'],
            default: 'active'
        }
    }],

    // Accreditation
    accreditations: [{
        organization: String,
        certificateNumber: String,
        level: String,
        issueDate: Date,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['active', 'expired', 'under_review'],
            default: 'active'
        }
    }],

    // Financial Information
    financial: {
        monthlyRevenue: {
            type: Number,
            default: 0
        },
        yearlyRevenue: {
            type: Number,
            default: 0
        },
        operatingCosts: {
            type: Number,
            default: 0
        },
        profitMargin: {
            type: Number,
            default: 0
        }
    },

    // Patient Statistics
    statistics: {
        totalPatientsRegistered: {
            type: Number,
            default: 0
        },
        monthlyPatients: {
            type: Number,
            default: 0
        },
        averagePatientsPerDay: {
            type: Number,
            default: 0
        },
        patientSatisfactionScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        }
    },

    // Settings & Configurations
    settings: {
        appointmentDuration: {
            type: Number,
            default: 30 // minutes
        },
        maxAppointmentsPerDay: {
            type: Number,
            default: 50
        },
        advanceBookingDays: {
            type: Number,
            default: 30
        },
        currency: {
            type: String,
            default: 'USD'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        language: {
            type: String,
            default: 'en'
        }
    },

    // Integration Settings
    integrations: {
        his: { // Hospital Information System
            enabled: {
                type: Boolean,
                default: false
            },
            vendor: String,
            apiEndpoint: String
        },
        lis: { // Laboratory Information System
            enabled: {
                type: Boolean,
                default: false
            },
            vendor: String,
            apiEndpoint: String
        },
        pacs: { // Picture Archiving and Communication System
            enabled: {
                type: Boolean,
                default: false
            },
            vendor: String,
            apiEndpoint: String
        },
        ehr: { // Electronic Health Records
            enabled: {
                type: Boolean,
                default: false
            },
            vendor: String,
            apiEndpoint: String
        }
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'under_construction', 'temporarily_closed'],
        default: 'active'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Hierarchy (for chain of branches)
    parentBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },

    childBranches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }],

    // Images
    images: [{
        url: String, // Cloudinary URL
        type: {
            type: String,
            enum: ['exterior', 'interior', 'equipment', 'staff', 'certificate']
        },
        description: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
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
branchSchema.index({ name: 'text' });
branchSchema.index({ type: 1 });
branchSchema.index({ status: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ 'address.city': 1 });
branchSchema.index({ 'address.state': 1 });
branchSchema.index({ deletedAt: 1 });

// Virtual for full address
branchSchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to check if branch is open at specific time
branchSchema.methods.isOpenAt = function (dateTime) {
    const date = new Date(dateTime);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeString = date.toTimeString().substring(0, 5); // "HH:MM"

    const daySchedule = this.operatingHours[dayOfWeek];
    if (!daySchedule || !daySchedule.isOpen) return false;

    // Check if time is within operating hours
    if (timeString < daySchedule.openTime || timeString > daySchedule.closeTime) return false;

    // Check if time is during break
    const isDuringBreak = daySchedule.breaks.some(breakTime =>
        timeString >= breakTime.startTime && timeString <= breakTime.endTime
    );

    return !isDuringBreak;
};

// Method to get active services
branchSchema.methods.getActiveServices = function () {
    return this.services.filter(service => service.isActive);
};

// Method to get active departments
branchSchema.methods.getActiveDepartments = function () {
    return this.departments.filter(dept => dept.isActive);
};

// Method to calculate occupancy rate
branchSchema.methods.getOccupancyRate = function () {
    if (this.facilities.totalBeds === 0) return 0;
    // This would require real-time bed occupancy data
    // For now, return a placeholder calculation
    return Math.round((this.statistics.averagePatientsPerDay / this.facilities.totalBeds) * 100);
};

// Static method to find branches by location
branchSchema.statics.findByLocation = function (city, state = null) {
    const query = {
        'address.city': { $regex: city, $options: 'i' },
        isActive: true,
        deletedAt: null
    };

    if (state) {
        query['address.state'] = { $regex: state, $options: 'i' };
    }

    return this.find(query);
};

// Static method to find branches with specific services
branchSchema.statics.findWithService = function (serviceName) {
    return this.find({
        'services.name': { $regex: serviceName, $options: 'i' },
        'services.isActive': true,
        isActive: true,
        deletedAt: null
    });
};

// Pre-save middleware to generate branch ID
branchSchema.pre('save', async function (next) {
    if (this.isNew) {
        const typeCode = this.type.substring(0, 2).toUpperCase();
        const count = await this.constructor.countDocuments({ type: this.type });
        this.branchId = `BR${typeCode}${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Branch', branchSchema);