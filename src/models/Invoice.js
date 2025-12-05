const mongoose = require('mongoose');

/**
 * Invoice Schema - Manages billing and payment information
 */
const invoiceSchema = new mongoose.Schema({
    // Invoice Identification
    invoiceId: {
        type: String,
        required: true,
        unique: true
    },

    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },

    // Customer Information
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    billingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    // Invoice Details
    invoiceDate: {
        type: Date,
        required: true,
        default: Date.now
    },

    dueDate: {
        type: Date,
        required: true
    },

    // Related Records
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },

    labReports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabReport'
    }],

    // Invoice Items
    items: [{
        description: {
            type: String,
            required: true
        },
        itemType: {
            type: String,
            enum: ['consultation', 'lab_test', 'procedure', 'medication', 'equipment', 'other'],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: {
                type: String,
                enum: ['percentage', 'fixed'],
                default: 'fixed'
            },
            value: {
                type: Number,
                default: 0,
                min: 0
            },
            reason: String
        },
        tax: {
            rate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            amount: {
                type: Number,
                default: 0
            }
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    // Financial Summary
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },

    totalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },

    totalTax: {
        type: Number,
        default: 0,
        min: 0
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    balanceAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
        default: 'pending'
    },

    paymentTerms: {
        type: String,
        enum: ['immediate', 'net_7', 'net_15', 'net_30', 'net_60'],
        default: 'immediate'
    },

    // Payment History
    payments: [{
        paymentId: {
            type: String,
            required: true
        },
        paymentDate: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'bank_transfer', 'online', 'upi', 'cheque', 'insurance'],
            required: true
        },
        reference: String, // Transaction ID, cheque number, etc.
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'completed'
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],

    // Insurance Information
    insurance: {
        isInsuranceClaimed: {
            type: Boolean,
            default: false
        },
        provider: String,
        policyNumber: String,
        claimNumber: String,
        approvedAmount: {
            type: Number,
            default: 0
        },
        claimStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'processing'],
            default: 'pending'
        },
        claimDate: Date,
        settledDate: Date,
        rejectionReason: String
    },

    // Discounts & Offers
    appliedOffers: [{
        offerCode: String,
        offerName: String,
        discountType: {
            type: String,
            enum: ['percentage', 'fixed']
        },
        discountValue: Number,
        discountAmount: Number
    }],

    // Invoice Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },

    // Communication
    sentAt: Date,

    remindersSent: [{
        sentAt: {
            type: Date,
            default: Date.now
        },
        method: {
            type: String,
            enum: ['email', 'sms', 'whatsapp']
        },
        template: String
    }],

    // Notes & Comments
    notes: String,

    internalNotes: String,

    // Document URLs
    invoiceUrl: String, // PDF URL

    receiptUrl: String, // Payment receipt URL

    // Branch Information
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    // Currency
    currency: {
        type: String,
        default: 'USD'
    },

    // Exchange Rate (for international)
    exchangeRate: {
        type: Number,
        default: 1
    },

    // Late Fees
    lateFees: [{
        feeDate: Date,
        amount: Number,
        reason: String,
        waived: {
            type: Boolean,
            default: false
        },
        waivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // AI Insights
    aiInsights: {
        paymentProbability: {
            type: Number,
            min: 0,
            max: 100
        },
        recommendedActions: [String],
        riskFactors: [String],
        lastAnalysis: Date
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
invoiceSchema.index({ patient: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ branchId: 1 });
invoiceSchema.index({ deletedAt: 1 });

// Compound indexes
invoiceSchema.index({ patient: 1, paymentStatus: 1, invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1, dueDate: 1 });

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function () {
    if (this.paymentStatus === 'paid' || this.status === 'cancelled') return 0;

    const today = new Date();
    const dueDate = new Date(this.dueDate);

    if (today > dueDate) {
        return Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

// Virtual for payment completion percentage
invoiceSchema.virtual('paymentPercentage').get(function () {
    if (this.totalAmount === 0) return 100;
    return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Method to add payment
invoiceSchema.methods.addPayment = function (paymentData) {
    // Generate payment ID
    const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const payment = {
        paymentId,
        ...paymentData
    };

    this.payments.push(payment);
    this.paidAmount += paymentData.amount;
    this.balanceAmount = this.totalAmount - this.paidAmount;

    // Update payment status
    if (this.paidAmount >= this.totalAmount) {
        this.paymentStatus = 'paid';
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.paymentStatus = 'partial';
    }

    return payment;
};

// Method to apply discount
invoiceSchema.methods.applyDiscount = function (discountType, discountValue, reason = '') {
    let discountAmount = 0;

    if (discountType === 'percentage') {
        discountAmount = (this.subtotal * discountValue) / 100;
    } else {
        discountAmount = discountValue;
    }

    // Apply discount to items proportionally
    this.items.forEach(item => {
        const itemDiscount = (item.totalAmount / this.subtotal) * discountAmount;
        item.discount = {
            type: discountType,
            value: discountType === 'percentage' ? discountValue : itemDiscount,
            reason: reason
        };
        item.totalAmount -= itemDiscount;
    });

    this.calculateTotals();
};

// Method to calculate totals
invoiceSchema.methods.calculateTotals = function () {
    this.subtotal = this.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
    }, 0);

    this.totalDiscount = this.items.reduce((sum, item) => {
        let discount = 0;
        if (item.discount.type === 'percentage') {
            discount = (item.quantity * item.unitPrice * item.discount.value) / 100;
        } else {
            discount = item.discount.value;
        }
        return sum + discount;
    }, 0);

    this.totalTax = this.items.reduce((sum, item) => {
        return sum + (item.tax.amount || 0);
    }, 0);

    this.totalAmount = this.subtotal - this.totalDiscount + this.totalTax;
    this.balanceAmount = this.totalAmount - this.paidAmount;
};

// Method to check if invoice is overdue
invoiceSchema.methods.isOverdue = function () {
    return new Date() > this.dueDate &&
        this.paymentStatus !== 'paid' &&
        this.status !== 'cancelled';
};

// Static method to find overdue invoices
invoiceSchema.statics.findOverdue = function () {
    const today = new Date();
    return this.find({
        dueDate: { $lt: today },
        paymentStatus: { $nin: ['paid', 'cancelled'] },
        deletedAt: null
    }).populate('patient', 'firstName lastName email phone');
};

// Static method to get revenue by date range
invoiceSchema.statics.getRevenueByDateRange = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                invoiceDate: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                deletedAt: null
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                totalInvoices: { $sum: 1 },
                avgInvoiceAmount: { $avg: '$totalAmount' }
            }
        }
    ]);
};

// Pre-save middleware to generate invoice ID and number
invoiceSchema.pre('save', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });

        this.invoiceId = `INV${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
        this.invoiceNumber = `MHO-${year}-${(count + 1).toString().padStart(6, '0')}`;

        // Set due date if not provided
        if (!this.dueDate) {
            this.dueDate = new Date(this.invoiceDate);
            switch (this.paymentTerms) {
                case 'net_7':
                    this.dueDate.setDate(this.dueDate.getDate() + 7);
                    break;
                case 'net_15':
                    this.dueDate.setDate(this.dueDate.getDate() + 15);
                    break;
                case 'net_30':
                    this.dueDate.setDate(this.dueDate.getDate() + 30);
                    break;
                case 'net_60':
                    this.dueDate.setDate(this.dueDate.getDate() + 60);
                    break;
                default:
                    // immediate payment
                    break;
            }
        }
    }

    // Calculate totals before saving
    this.calculateTotals();

    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);