const mongoose = require('mongoose');

/**
 * Inventory Schema - Manages medical supplies, equipment, and medications
 */
const inventorySchema = new mongoose.Schema({
    // Item Identification
    itemId: {
        type: String,
        required: true,
        unique: true
    },

    itemCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        maxlength: 1000
    },

    // Item Classification
    category: {
        type: String,
        required: true,
        enum: [
            'medication', 'medical_device', 'lab_reagent', 'surgical_instrument',
            'consumable', 'equipment', 'diagnostic_kit', 'ppe', 'office_supply'
        ]
    },

    subcategory: String,

    type: {
        type: String,
        enum: ['drug', 'device', 'reagent', 'supply', 'equipment']
    },

    // Medication-specific fields
    drugInfo: {
        genericName: String,
        brandName: String,
        activeIngredient: String,
        strength: String,
        dosageForm: {
            type: String,
            enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler']
        },
        therapeuticClass: String,
        contraindications: [String],
        sideEffects: [String],
        drugInteractions: [String]
    },

    // Physical Properties
    specifications: {
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'mm', 'inch'],
                default: 'cm'
            }
        },
        weight: {
            value: Number,
            unit: {
                type: String,
                enum: ['kg', 'g', 'lb'],
                default: 'kg'
            }
        },
        color: String,
        material: String
    },

    // Stock Information
    stock: {
        currentQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        unit: {
            type: String,
            required: true,
            enum: ['pieces', 'boxes', 'vials', 'bottles', 'packets', 'strips', 'ml', 'kg', 'units']
        },
        minimumStock: {
            type: Number,
            required: true,
            min: 0
        },
        maximumStock: {
            type: Number,
            required: true
        },
        reorderLevel: {
            type: Number,
            required: true,
            min: 0
        },
        averageConsumption: {
            daily: {
                type: Number,
                default: 0
            },
            weekly: {
                type: Number,
                default: 0
            },
            monthly: {
                type: Number,
                default: 0
            }
        }
    },

    // Pricing Information
    pricing: {
        costPrice: {
            type: Number,
            required: true,
            min: 0
        },
        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },
        mrp: Number, // Maximum Retail Price
        margin: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // Supplier Information
    suppliers: [{
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier'
        },
        supplierName: String,
        contactPerson: String,
        phone: String,
        email: String,
        costPrice: Number,
        leadTime: Number, // in days
        minimumOrderQuantity: Number,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],

    // Batch Information
    batches: [{
        batchNumber: {
            type: String,
            required: true
        },
        manufacturingDate: Date,
        expiryDate: Date,
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        costPrice: Number,
        supplier: String,
        receivedDate: Date,
        status: {
            type: String,
            enum: ['active', 'expired', 'recalled', 'damaged'],
            default: 'active'
        }
    }],

    // Location & Storage
    storage: {
        location: {
            building: String,
            floor: String,
            room: String,
            rack: String,
            shelf: String
        },
        storageConditions: {
            temperature: {
                min: Number,
                max: Number,
                unit: {
                    type: String,
                    enum: ['C', 'F'],
                    default: 'C'
                }
            },
            humidity: {
                min: Number,
                max: Number
            },
            specialConditions: [String] // "Keep in dark", "Refrigerate", etc.
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch'
        }
    },

    // Movement History
    movementHistory: [{
        transactionType: {
            type: String,
            enum: ['purchase', 'sale', 'transfer', 'adjustment', 'return', 'damage', 'expiry'],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        reference: String, // PO number, invoice number, etc.
        notes: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        batchNumber: String,
        unitPrice: Number,
        totalValue: Number
    }],

    // Purchase Orders
    purchaseOrders: [{
        poNumber: String,
        supplier: String,
        orderDate: Date,
        expectedDelivery: Date,
        quantity: Number,
        unitPrice: Number,
        totalAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'partial', 'received', 'cancelled'],
            default: 'pending'
        }
    }],

    // Quality Control
    qualityControl: {
        requiresTesting: {
            type: Boolean,
            default: false
        },
        testParameters: [String],
        certificateRequired: {
            type: Boolean,
            default: false
        },
        lastTestedDate: Date,
        testResults: {
            passed: Boolean,
            notes: String,
            testedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    },

    // Alerts & Notifications
    alerts: {
        lowStock: {
            enabled: {
                type: Boolean,
                default: true
            },
            threshold: Number,
            lastAlertSent: Date
        },
        expiry: {
            enabled: {
                type: Boolean,
                default: true
            },
            daysBefore: {
                type: Number,
                default: 30
            },
            lastAlertSent: Date
        },
        overstock: {
            enabled: {
                type: Boolean,
                default: false
            },
            threshold: Number
        }
    },

    // Regulatory & Compliance
    regulatory: {
        isControlled: {
            type: Boolean,
            default: false
        },
        controlledSubstanceSchedule: String,
        requiresPrescription: {
            type: Boolean,
            default: false
        },
        fdaApprovalNumber: String,
        licenseRequired: {
            type: Boolean,
            default: false
        },
        hazardousClassification: String
    },

    // Usage Analytics
    analytics: {
        totalConsumed: {
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
            }
        },
        averageMonthlyUsage: {
            type: Number,
            default: 0
        },
        popularityScore: {
            type: Number,
            default: 0
        },
        lastUsedDate: Date,
        frequentUsers: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            usageCount: Number
        }]
    },

    // AI Insights
    aiInsights: {
        predictedConsumption: {
            nextMonth: Number,
            nextQuarter: Number,
            confidence: Number
        },
        reorderRecommendation: {
            suggestedQuantity: Number,
            urgency: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical']
            },
            reasoning: String
        },
        expiryRisk: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            itemsAtRisk: Number,
            recommendations: [String]
        },
        costOptimization: {
            recommendations: [String],
            potentialSavings: Number
        },
        lastAnalysis: Date
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued', 'pending_approval'],
        default: 'active'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Multi-branch Support
    branches: [{
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch'
        },
        stock: {
            currentQuantity: Number,
            minimumStock: Number,
            reorderLevel: Number
        },
        location: {
            rack: String,
            shelf: String
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    }],

    // Barcode & QR Code
    barcode: String,
    qrCode: String,

    // Images
    images: [{
        url: String, // Cloudinary URL
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
inventorySchema.index({ name: 'text', description: 'text' });
inventorySchema.index({ category: 1 });
inventorySchema.index({ 'stock.currentQuantity': 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ isActive: 1 });
inventorySchema.index({ 'storage.branchId': 1 });
inventorySchema.index({ deletedAt: 1 });
inventorySchema.index({ 'batches.expiryDate': 1 });

// Compound indexes
inventorySchema.index({ category: 1, status: 1, isActive: 1 });
inventorySchema.index({ 'storage.branchId': 1, category: 1 });

// Virtual for days until expiry (next expiring batch)
inventorySchema.virtual('daysUntilExpiry').get(function () {
    const activeBatches = this.batches.filter(batch =>
        batch.status === 'active' && batch.quantity > 0
    );

    if (activeBatches.length === 0) return null;

    const nextExpiry = new Date(Math.min(...activeBatches.map(batch =>
        new Date(batch.expiryDate)
    )));

    const today = new Date();
    const diffTime = nextExpiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function () {
    const current = this.stock.currentQuantity;
    const minimum = this.stock.minimumStock;
    const reorder = this.stock.reorderLevel;

    if (current === 0) return 'out_of_stock';
    if (current <= minimum) return 'critical';
    if (current <= reorder) return 'low';
    if (current >= this.stock.maximumStock) return 'overstock';
    return 'normal';
});

// Method to check if item needs reordering
inventorySchema.methods.needsReordering = function () {
    return this.stock.currentQuantity <= this.stock.reorderLevel;
};

// Method to get available quantity (excluding expired batches)
inventorySchema.methods.getAvailableQuantity = function () {
    const today = new Date();
    return this.batches
        .filter(batch =>
            batch.status === 'active' &&
            batch.quantity > 0 &&
            new Date(batch.expiryDate) > today
        )
        .reduce((total, batch) => total + batch.quantity, 0);
};

// Method to get expiring items
inventorySchema.methods.getExpiringBatches = function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return this.batches.filter(batch =>
        batch.status === 'active' &&
        batch.quantity > 0 &&
        new Date(batch.expiryDate) <= cutoffDate
    );
};

// Method to update stock
inventorySchema.methods.updateStock = function (quantity, transactionType, reference = '', notes = '', performedBy = null, batchNumber = null) {
    // Update current quantity
    if (['purchase', 'return', 'adjustment'].includes(transactionType) && quantity > 0) {
        this.stock.currentQuantity += quantity;
    } else if (['sale', 'transfer', 'damage', 'expiry'].includes(transactionType)) {
        this.stock.currentQuantity -= quantity;
    }

    // Add to movement history
    this.movementHistory.push({
        transactionType,
        quantity,
        reference,
        notes,
        performedBy,
        batchNumber,
        unitPrice: this.pricing.costPrice,
        totalValue: quantity * this.pricing.costPrice
    });

    // Update batch if specified
    if (batchNumber) {
        const batch = this.batches.find(b => b.batchNumber === batchNumber);
        if (batch) {
            if (transactionType === 'purchase') {
                batch.quantity += quantity;
            } else {
                batch.quantity -= quantity;
            }
        }
    }
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = function (branchId = null) {
    const query = {
        isActive: true,
        deletedAt: null,
        $expr: { $lte: ['$stock.currentQuantity', '$stock.reorderLevel'] }
    };

    if (branchId) {
        query['storage.branchId'] = branchId;
    }

    return this.find(query).sort({ 'stock.currentQuantity': 1 });
};

// Static method to find expiring items
inventorySchema.statics.findExpiring = function (days = 30, branchId = null) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const query = {
        isActive: true,
        deletedAt: null,
        'batches.expiryDate': { $lte: cutoffDate },
        'batches.status': 'active',
        'batches.quantity': { $gt: 0 }
    };

    if (branchId) {
        query['storage.branchId'] = branchId;
    }

    return this.find(query);
};

// Pre-save middleware to generate item ID
inventorySchema.pre('save', async function (next) {
    if (this.isNew) {
        const categoryCode = this.category.substring(0, 3).toUpperCase();
        const count = await this.constructor.countDocuments({ category: this.category });
        this.itemId = `${categoryCode}${(count + 1).toString().padStart(4, '0')}`;

        // Calculate margin
        if (this.pricing.costPrice && this.pricing.sellingPrice) {
            this.pricing.margin = ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
        }
    }
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);