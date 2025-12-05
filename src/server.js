const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n⚠️ Please set these environment variables and restart the server.');
  process.exit(1);
}

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const labTestRoutes = require('./routes/labTests');
const labReportRoutes = require('./routes/labReports');
const invoiceRoutes = require('./routes/invoices');
const inventoryRoutes = require('./routes/inventory');
const branchRoutes = require('./routes/branches');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // Default: 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://mediai-healthos.vercel.app',
            'https://mediai-healthos-admin.vercel.app'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'MediAI HealthOS API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// API version prefix
const API_VERSION = '/api/v1';

// Public routes (no authentication required)
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/health`, (req, res) => {
    res.json({ message: 'API Health Check OK' });
});

// Protected routes (authentication required)
app.use(`${API_VERSION}/users`, authMiddleware, userRoutes);
app.use(`${API_VERSION}/patients`, authMiddleware, patientRoutes);
app.use(`${API_VERSION}/doctors`, authMiddleware, doctorRoutes);
app.use(`${API_VERSION}/appointments`, authMiddleware, appointmentRoutes);
app.use(`${API_VERSION}/lab-tests`, authMiddleware, labTestRoutes);
app.use(`${API_VERSION}/lab-reports`, authMiddleware, labReportRoutes);
app.use(`${API_VERSION}/invoices`, authMiddleware, invoiceRoutes);
app.use(`${API_VERSION}/inventory`, authMiddleware, inventoryRoutes);
app.use(`${API_VERSION}/branches`, authMiddleware, branchRoutes);
app.use(`${API_VERSION}/analytics`, authMiddleware, analyticsRoutes);
app.use(`${API_VERSION}/ai`, authMiddleware, aiRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 MediAI HealthOS API Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
    console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;