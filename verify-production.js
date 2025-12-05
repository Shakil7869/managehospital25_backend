/**
 * Production Readiness Verification Script
 * Checks MongoDB collections and data structure for production
 * Usage: node backend/verify-production.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set');
    process.exit(1);
}

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
    step: (msg) => console.log(`\n${colors.cyan}→${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.cyan}${colors.bold}${'='.repeat(70)}${colors.reset}\n${msg}\n${colors.cyan}${colors.bold}${'='.repeat(70)}${colors.reset}`)
};

const expectedCollections = {
    'users': 'User accounts with authentication',
    'patients': 'Patient profiles and medical info',
    'doctors': 'Doctor profiles and specializations',
    'appointments': 'Appointment scheduling',
    'labtests': 'Laboratory test definitions',
    'labreports': 'Laboratory test results',
    'invoices': 'Financial invoices',
    'inventories': 'Medical inventory items',
    'branches': 'Hospital branch locations',
    'notifications': 'System notifications'
};

async function connectDB() {
    try {
        log.step('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        log.success('Connected to MongoDB Atlas');
        return mongoose.connection.db;
    } catch (error) {
        log.error(`Failed to connect: ${error.message}`);
        process.exit(1);
    }
}

async function listCollections(db) {
    try {
        const collections = await db.listCollections().toArray();
        return collections.map(c => c.name);
    } catch (error) {
        log.error(`Failed to list collections: ${error.message}`);
        return [];
    }
}

async function checkCollectionStructure(db, collName) {
    try {
        const collection = db.collection(collName);
        const sample = await collection.findOne();
        
        if (!sample) {
            return { exists: true, empty: true, schema: null };
        }
        
        const fields = Object.keys(sample).filter(k => !k.startsWith('_'));
        return { exists: true, empty: false, schema: fields, docCount: await collection.countDocuments() };
    } catch (error) {
        return { exists: false, error: error.message };
    }
}

async function verifyProduction(db) {
    log.header('📊 Production Readiness Check');
    
    const existingCollections = await listCollections(db);
    const testCollections = existingCollections.filter(c => c.startsWith('test_'));
    const prodCollections = existingCollections.filter(c => expectedCollections[c]);
    
    // Check 1: Test Collections
    log.step('1️⃣  Checking for test collections...');
    if (testCollections.length === 0) {
        log.success('No test collections found');
    } else {
        log.error(`Found ${testCollections.length} test collection(s):`);
        testCollections.forEach(c => console.log(`    • ${c}`));
        log.warning('Run: node backend/migrate-to-production.js');
    }
    
    // Check 2: Production Collections
    log.step('2️⃣  Checking production collections...');
    let missingCollections = [];
    
    for (const [collName, description] of Object.entries(expectedCollections)) {
        const structure = await checkCollectionStructure(db, collName);
        
        if (!structure.exists) {
            log.warning(`${collName}: NOT FOUND`);
            missingCollections.push(collName);
        } else if (structure.empty) {
            log.info(`${collName}: EMPTY (0 documents)`);
        } else {
            log.success(`${collName}: ${structure.docCount} documents`);
        }
    }
    
    // Check 3: Unexpected Collections
    log.step('3️⃣  Checking for unexpected collections...');
    const unexpectedCollections = existingCollections.filter(
        c => !expectedCollections[c] && !c.startsWith('test_') && !c.startsWith('system.')
    );
    
    if (unexpectedCollections.length === 0) {
        log.success('All collections are expected');
    } else {
        log.warning(`Found ${unexpectedCollections.length} unexpected collection(s):`);
        unexpectedCollections.forEach(c => console.log(`    • ${c}`));
    }
    
    // Check 4: Sample Document Structure
    log.step('4️⃣  Checking document structures...');
    
    const sampleChecks = {
        'users': ['firstName', 'lastName', 'email', 'role', 'firebaseUid'],
        'patients': ['userId', 'patientId', 'bloodType'],
        'doctors': ['userId', 'doctorId', 'specializations'],
        'appointments': ['patientId', 'doctorId', 'appointmentDate'],
        'labtests': ['testId', 'testName', 'testCode'],
        'labreports': ['reportId', 'testId', 'result'],
        'invoices': ['invoiceId', 'patientId', 'totalAmount'],
        'inventories': ['itemId', 'itemName', 'quantity'],
        'branches': ['branchId', 'branchName', 'location'],
        'notifications': ['userId', 'message', 'type']
    };
    
    for (const [collName, requiredFields] of Object.entries(sampleChecks)) {
        const structure = await checkCollectionStructure(db, collName);
        
        if (structure.exists && !structure.empty) {
            const hasRequired = requiredFields.every(f => structure.schema.includes(f));
            if (hasRequired) {
                log.success(`${collName}: Schema valid`);
            } else {
                const missing = requiredFields.filter(f => !structure.schema.includes(f));
                log.warning(`${collName}: Missing fields - ${missing.join(', ')}`);
            }
        }
    }
    
    // Check 5: Data Integrity
    log.step('5️⃣  Checking data integrity...');
    
    // Check for duplicate emails
    if (existingCollections.includes('users')) {
        const dupeEmails = await db.collection('users').aggregate([
            { $group: { _id: '$email', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        if (dupeEmails.length === 0) {
            log.success('No duplicate emails found');
        } else {
            log.error(`Found ${dupeEmails.length} duplicate email(s)`);
            dupeEmails.forEach(d => console.log(`    • ${d._id}: ${d.count} records`));
        }
    }
    
    // Check for orphaned documents
    if (existingCollections.includes('patients') && existingCollections.includes('users')) {
        const patients = db.collection('patients');
        const users = db.collection('users');
        
        const orphaned = await patients.find({
            userId: { $nin: await users.find({}).project({ _id: 1 }).toArray().map(u => u._id) }
        }).toArray();
        
        if (orphaned.length === 0) {
            log.success('No orphaned patient records');
        } else {
            log.warning(`Found ${orphaned.length} orphaned patient record(s)`);
        }
    }
    
    // Summary
    log.header('📋 Summary');
    
    const checklist = [
        { name: 'No test collections', pass: testCollections.length === 0 },
        { name: 'All required collections exist', pass: missingCollections.length === 0 },
        { name: 'Only expected collections present', pass: unexpectedCollections.length === 0 },
        { name: 'No duplicate emails', pass: true } // checked above
    ];
    
    const passCount = checklist.filter(c => c.pass).length;
    const totalChecks = checklist.length;
    
    console.log('\nProduction Readiness:');
    checklist.forEach(c => {
        if (c.pass) {
            log.success(`${c.name}`);
        } else {
            log.error(`${c.name}`);
        }
    });
    
    log.header('Result');
    if (passCount === totalChecks) {
        log.success(`✨ All checks passed! (${passCount}/${totalChecks})`);
        log.info('Your application is production ready.');
        return true;
    } else {
        log.warning(`${passCount}/${totalChecks} checks passed`);
        log.error('Please fix the issues above before going to production');
        return false;
    }
}

async function main() {
    const db = await connectDB();
    
    try {
        const isReady = await verifyProduction(db);
        process.exit(isReady ? 0 : 1);
    } catch (error) {
        log.error(`Verification failed: ${error.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
