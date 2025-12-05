const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');

// AI Services
const aiFollowUpService = require('../ai/followUpService');
const aiReportService = require('../ai/reportService');
const aiReferralService = require('../ai/referralService');
const aiSchedulingService = require('../ai/schedulingService');
const aiInventoryService = require('../ai/inventoryService');
const aiVoiceService = require('../ai/voiceService');
const aiFraudService = require('../ai/fraudService');
const aiAnalyticsService = require('../ai/analyticsService');
const aiHealthService = require('../ai/healthService');
const aiAssistantService = require('../ai/assistantService');

const router = express.Router();

/**
 * @route   POST /api/v1/ai/follow-up
 * @desc    Generate automated patient follow-up messages
 * @access  Private
 */
router.post('/follow-up',
    checkPermission('patient_read'),
    asyncHandler(async (req, res) => {
        const { patientId, appointmentId, type } = req.body;

        const followUpMessage = await aiFollowUpService.generateFollowUp({
            patientId,
            appointmentId,
            type,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Follow-up message generated successfully',
            data: { followUpMessage }
        });
    })
);

/**
 * @route   POST /api/v1/ai/report-analysis
 * @desc    Analyze lab report and highlight abnormalities
 * @access  Private
 */
router.post('/report-analysis',
    checkPermission('lab_read'),
    asyncHandler(async (req, res) => {
        const { reportId, results } = req.body;

        const analysis = await aiReportService.analyzeReport({
            reportId,
            results,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Report analysis completed',
            data: { analysis }
        });
    })
);

/**
 * @route   POST /api/v1/ai/referral-recommendation
 * @desc    Recommend optimal referral doctors/labs
 * @access  Private
 */
router.post('/referral-recommendation',
    checkPermission('doctor_read'),
    asyncHandler(async (req, res) => {
        const { patientLocation, specialization, urgency } = req.body;

        const recommendations = await aiReferralService.getRecommendations({
            patientLocation,
            specialization,
            urgency,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Referral recommendations generated',
            data: { recommendations }
        });
    })
);

/**
 * @route   POST /api/v1/ai/schedule-optimization
 * @desc    Optimize doctor appointment schedules
 * @access  Private
 */
router.post('/schedule-optimization',
    checkPermission('appointment_read'),
    asyncHandler(async (req, res) => {
        const { doctorId, date, constraints } = req.body;

        const optimizedSchedule = await aiSchedulingService.optimizeSchedule({
            doctorId,
            date,
            constraints,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Schedule optimized successfully',
            data: { optimizedSchedule }
        });
    })
);

/**
 * @route   POST /api/v1/ai/inventory-prediction
 * @desc    Predict inventory needs and usage patterns
 * @access  Private
 */
router.post('/inventory-prediction',
    checkPermission('inventory_read'),
    asyncHandler(async (req, res) => {
        const { branchId, timeframe } = req.body;

        const predictions = await aiInventoryService.predictInventoryNeeds({
            branchId,
            timeframe,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Inventory predictions generated',
            data: { predictions }
        });
    })
);

/**
 * @route   POST /api/v1/ai/voice-to-report
 * @desc    Convert voice recording to structured report
 * @access  Private
 */
router.post('/voice-to-report',
    checkPermission('appointment_write'),
    asyncHandler(async (req, res) => {
        const { audioData, appointmentId, language } = req.body;

        const reportData = await aiVoiceService.convertVoiceToReport({
            audioData,
            appointmentId,
            language: language || 'en',
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Voice converted to report successfully',
            data: { reportData }
        });
    })
);

/**
 * @route   POST /api/v1/ai/fraud-detection
 * @desc    Detect potential fraudulent activities
 * @access  Private (Admin)
 */
router.post('/fraud-detection',
    checkPermission('admin_access'),
    asyncHandler(async (req, res) => {
        const { transactionData, branchId } = req.body;

        const fraudAnalysis = await aiFraudService.detectFraud({
            transactionData,
            branchId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Fraud detection analysis completed',
            data: { fraudAnalysis }
        });
    })
);

/**
 * @route   GET /api/v1/ai/analytics/revenue-forecast
 * @desc    Generate revenue and performance forecasts
 * @access  Private
 */
router.get('/analytics/revenue-forecast',
    checkPermission('analytics_read'),
    asyncHandler(async (req, res) => {
        const { branchId, timeframe } = req.query;

        const forecast = await aiAnalyticsService.generateRevenueForecast({
            branchId,
            timeframe,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Revenue forecast generated',
            data: { forecast }
        });
    })
);

/**
 * @route   POST /api/v1/ai/health-insights
 * @desc    Generate predictive health insights for patients
 * @access  Private
 */
router.post('/health-insights',
    checkPermission('patient_read'),
    asyncHandler(async (req, res) => {
        const { patientId, medicalHistory } = req.body;

        const insights = await aiHealthService.generateHealthInsights({
            patientId,
            medicalHistory,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Health insights generated',
            data: { insights }
        });
    })
);

/**
 * @route   POST /api/v1/ai/virtual-assistant
 * @desc    Virtual health assistant for patient queries
 * @access  Private
 */
router.post('/virtual-assistant',
    asyncHandler(async (req, res) => {
        const { query, context, patientId } = req.body;

        const response = await aiAssistantService.handleQuery({
            query,
            context,
            patientId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Assistant response generated',
            data: { response }
        });
    })
);

/**
 * @route   GET /api/v1/ai/dashboard-insights
 * @desc    Get AI-powered dashboard insights
 * @access  Private
 */
router.get('/dashboard-insights',
    checkPermission('analytics_read'),
    asyncHandler(async (req, res) => {
        const { branchId } = req.query;

        const insights = await aiAnalyticsService.getDashboardInsights({
            branchId: branchId || req.user.branchId,
            userId: req.user._id,
            userRole: req.user.role
        });

        res.status(200).json({
            success: true,
            message: 'Dashboard insights generated',
            data: { insights }
        });
    })
);

module.exports = router;