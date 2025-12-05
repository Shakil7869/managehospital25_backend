/**
 * MongoDB Data Migration Script
 * Migrates data from test collections to production collections
 * Usage: node backend/migrate-to-production.js
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
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
    step: (msg) => console.log(`\n${colors.cyan}→${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${msg}\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

// Collection mapping: test -> production
const collectionMap = {
    'test_users': 'users',
    'test_patients': 'patients',
    'test_doctors': 'doctors',
    'test_appointments': 'appointments',
    'test_labtests': 'labtests',
    'test_labreports': 'labreports',
    'test_invoices': 'invoices',
    'test_inventories': 'inventories',
    'test_branches': 'branches',
    'test_notifications': 'notifications'
};

async function connectDB() {
    try {
        log.step('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        log.success('Connected to MongoDB Atlas');
        return mongoose.connection.db;
    } catch (error) {
        log.error(`Failed to connect to MongoDB: ${error.message}`);
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

async function migrateCollections(db) {
    log.header('MongoDB Data Migration: Test → Production');

    const existingCollections = await listCollections(db);
    log.info(`Found ${existingCollections.length} collections in database`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [testName, prodName] of Object.entries(collectionMap)) {
        // Check if test collection exists
        if (!existingCollections.includes(testName)) {
            log.warning(`Skipping ${testName} (not found)`);
            skippedCount++;
            continue;
        }

        // Check if production collection already exists
        if (existingCollections.includes(prodName)) {
            log.warning(`${prodName} already exists (test data will not override)`);

            const testCount = await db.collection(testName).countDocuments();
            const prodCount = await db.collection(prodName).countDocuments();

            log.info(`  Test collection: ${testCount} documents`);
            log.info(`  Prod collection: ${prodCount} documents`);

            // Ask if user wants to append or skip
            if (testCount > 0 && prodCount === 0) {
                log.info(`  → Will rename ${testName} to ${prodName}`);
            } else if (prodCount > 0) {
                log.info(`  → Keeping existing ${prodName} data`);
                skippedCount++;
                continue;
            }
        }

        try {
            log.step(`Migrating ${testName} → ${prodName}`);

            const testCollection = db.collection(testName);
            const docCount = await testCollection.countDocuments();

            if (docCount === 0) {
                log.warning(`${testName} is empty, skipping`);
                skippedCount++;
                continue;
            }

            // Check if destination exists and has data
            if (existingCollections.includes(prodName)) {
                const prodCount = await db.collection(prodName).countDocuments();
                if (prodCount > 0) {
                    log.warning(`${prodName} already has ${prodCount} documents, skipping migration`);
                    skippedCount++;
                    continue;
                }
            }

            // Rename collection
            await testCollection.rename(prodName, { dropTarget: true });
            log.success(`✓ ${testName} → ${prodName} (${docCount} documents)`);
            migratedCount++;

        } catch (error) {
            if (error.message.includes('source namespace does not exist')) {
                log.warning(`${testName} not found in database`);
                skippedCount++;
            } else {
                log.error(`Failed to migrate ${testName}: ${error.message}`);
                errorCount++;
            }
        }
    }

    return { migratedCount, skippedCount, errorCount };
}

async function verifyMigration(db) {
    log.header('Verifying Migration');

    const productionCollections = ['users', 'patients', 'doctors', 'appointments', 'labtests', 'labreports', 'invoices', 'inventories', 'branches', 'notifications'];

    let allValid = true;

    for (const collName of productionCollections) {
        try {
            const collection = db.collection(collName);
            const docCount = await collection.countDocuments();

            if (docCount === 0) {
                log.warning(`${collName}: 0 documents`);
            } else {
                log.success(`${collName}: ${docCount} documents`);
            }
        } catch (error) {
            log.error(`${collName}: ${error.message}`);
            allValid = false;
        }
    }

    return allValid;
}

async function checkForTestCollections(db) {
    log.step('Checking for remaining test collections...');

    const collections = await listCollections(db);
    const testCollections = collections.filter(c => c.startsWith('test_'));

    if (testCollections.length === 0) {
        log.success('No test collections found');
        return true;
    }

    log.warning(`Found ${testCollections.length} test collection(s):`);
    testCollections.forEach(c => {
        console.log(`  • ${c}`);
    });

    return false;
}

async function main() {
    const db = await connectDB();

    try {
        // Perform migration
        const { migratedCount, skippedCount, errorCount } = await migrateCollections(db);

        log.header('Migration Summary');
        log.success(`Migrated: ${migratedCount} collections`);
        if (skippedCount > 0) log.warning(`Skipped: ${skippedCount} collections`);
        if (errorCount > 0) log.error(`Errors: ${errorCount} collections`);

        // Verify migration
        const isValid = await verifyMigration(db);

        // Check for remaining test collections
        const noTestCollections = await checkForTestCollections(db);

        log.header('Status');
        if (isValid && noTestCollections && errorCount === 0) {
            log.success('Migration completed successfully!');
            log.info('Your application is now using production collection names');
            log.info('Next step: Test signup/login to verify everything works');
        } else {
            log.warning('Migration completed with issues. Please review above.');
        }

    } catch (error) {
        log.error(`Migration failed: ${error.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        log.step('Disconnected from MongoDB');
    }
}

main();
