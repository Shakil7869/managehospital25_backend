const { body, validationResult } = require('express-validator');

/**
 * User registration validation
 */
const validateUserRegistration = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('phone')
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),

    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('role')
        .isIn(['patient', 'doctor', 'admin', 'receptionist', 'lab_technician'])
        .withMessage('Invalid role specified'),

    body('branchId')
        .isMongoId()
        .withMessage('Invalid branch ID')
];

/**
 * User login validation
 */
const validateUserLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

/**
 * Appointment creation validation
 */
const validateAppointment = [
    body('patient')
        .isMongoId()
        .withMessage('Invalid patient ID'),

    body('doctor')
        .isMongoId()
        .withMessage('Invalid doctor ID'),

    body('scheduledDate')
        .isISO8601()
        .withMessage('Please provide a valid date'),

    body('scheduledTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid time in HH:MM format'),

    body('type')
        .isIn(['consultation', 'follow_up', 'emergency', 'surgery', 'procedure', 'check_up'])
        .withMessage('Invalid appointment type'),

    body('consultationType')
        .isIn(['in_person', 'video_call', 'phone_call', 'chat'])
        .withMessage('Invalid consultation type'),

    body('chiefComplaint')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Chief complaint must be between 5 and 500 characters'),

    body('branchId')
        .isMongoId()
        .withMessage('Invalid branch ID')
];

/**
 * Lab test creation validation
 */
const validateLabTest = [
    body('testName')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Test name must be between 2 and 200 characters'),

    body('testCode')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Test code must be between 2 and 20 characters'),

    body('category')
        .isIn([
            'hematology', 'biochemistry', 'microbiology', 'pathology',
            'radiology', 'cardiology', 'neurology', 'endocrinology',
            'immunology', 'genetics', 'toxicology', 'cytology'
        ])
        .withMessage('Invalid test category'),

    body('sampleType')
        .isIn([
            'blood', 'urine', 'stool', 'sputum', 'saliva', 'tissue',
            'csf', 'swab', 'fluid', 'hair', 'nail', 'other'
        ])
        .withMessage('Invalid sample type'),

    body('pricing.basePrice')
        .isFloat({ min: 0 })
        .withMessage('Base price must be a positive number'),

    body('processingTime.duration')
        .isInt({ min: 1 })
        .withMessage('Processing time duration must be a positive integer')
];

/**
 * Inventory item creation validation
 */
const validateInventory = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Item name must be between 2 and 200 characters'),

    body('category')
        .isIn([
            'medication', 'medical_device', 'lab_reagent', 'surgical_instrument',
            'consumable', 'equipment', 'diagnostic_kit', 'ppe', 'office_supply'
        ])
        .withMessage('Invalid item category'),

    body('stock.unit')
        .isIn(['pieces', 'boxes', 'vials', 'bottles', 'packets', 'strips', 'ml', 'kg', 'units'])
        .withMessage('Invalid stock unit'),

    body('stock.minimumStock')
        .isInt({ min: 0 })
        .withMessage('Minimum stock must be a non-negative integer'),

    body('stock.maximumStock')
        .isInt({ min: 1 })
        .withMessage('Maximum stock must be a positive integer'),

    body('pricing.costPrice')
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a non-negative number'),

    body('pricing.sellingPrice')
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a non-negative number')
];

/**
 * Invoice creation validation
 */
const validateInvoice = [
    body('patient')
        .isMongoId()
        .withMessage('Invalid patient ID'),

    body('items')
        .isArray({ min: 1 })
        .withMessage('Invoice must have at least one item'),

    body('items.*.description')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Item description must be between 2 and 200 characters'),

    body('items.*.itemType')
        .isIn(['consultation', 'lab_test', 'procedure', 'medication', 'equipment', 'other'])
        .withMessage('Invalid item type'),

    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Item quantity must be a positive integer'),

    body('items.*.unitPrice')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a non-negative number'),

    body('branchId')
        .isMongoId()
        .withMessage('Invalid branch ID')
];

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errorMessages
        });
    }

    next();
};

/**
 * Pagination validation
 */
const validatePagination = [
    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

/**
 * Date range validation
 */
const validateDateRange = [
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),

    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
            if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        })
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateAppointment,
    validateLabTest,
    validateInventory,
    validateInvoice,
    validatePagination,
    validateDateRange,
    handleValidationErrors
};