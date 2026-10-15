/**
 * Standalone verification script for CARGOFLIGHT dedicated MongoDB Atlas telemetry database
 * Usage:
 *   node scripts/test-mongodb-connection.js "<ATLAS_CONNECTION_STRING>"
 * Or:
 *   $env:SPRING_DATA_MONGODB_URI="mongodb+srv://..."
 *   node scripts/test-mongodb-connection.js
 */

const { MongoClient } = require('mongodb');

async function verifyMongoAtlas() {
  const uri = process.argv[2] || process.env.SPRING_DATA_MONGODB_URI || 'mongodb://localhost:27017/aerotrace_telemetry';
  
  // Safe sanitized URI for logging
  const safeUri = uri.replace(/:[^:@]+@/, ':***@').replace(/\?.*$/, '');
  console.log('================================================================');
  console.log('CARGOFLIGHT MongoDB Atlas Dedicated Telemetry Verification');
  console.log('Target Endpoint:', safeUri);
  console.log('================================================================\n');

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

  try {
    console.log('1. Connecting to cluster...');
    await client.connect();
    console.log('   ✓ Connected successfully!\n');

    console.log('2. Running cluster ping...');
    const db = client.db('aerotrace_telemetry');
    const ping = await db.command({ ping: 1 });
    console.log('   ✓ Database ping OK:', ping.ok === 1 ? 'PASS' : 'FAIL', '\n');

    console.log('3. Inspecting / Ensuring required collections in aerotrace_telemetry...');
    const requiredCollections = ['raw_scanner_events', 'scanner_diagnostics', 'scan_dead_letter_queue'];
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    for (const col of requiredCollections) {
      if (!existingCollections.includes(col)) {
        await db.createCollection(col);
        console.log(`   + Created missing collection: ${col}`);
      } else {
        console.log(`   ✓ Found existing collection: ${col}`);
      }
    }

    console.log('\n4. Ensuring indexes and 7-day TTL policy...');
    // raw_scanner_events indexes
    await db.collection('raw_scanner_events').createIndex({ idempotencyKey: 1 }, { unique: true });
    await db.collection('raw_scanner_events').createIndex({ baggageTag: 1, timestamp: -1 });
    await db.collection('raw_scanner_events').createIndex({ scannerId: 1, timestamp: -1 });
    await db.collection('raw_scanner_events').createIndex({ handlingPointId: 1 });
    await db.collection('raw_scanner_events').createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 });
    console.log('   ✓ raw_scanner_events indexes verified (Unique Idempotency + 7-Day TTL)');

    // scanner_diagnostics indexes
    await db.collection('scanner_diagnostics').createIndex({ scannerId: 1, recordedAt: -1 });
    await db.collection('scanner_diagnostics').createIndex({ status: 1 });
    await db.collection('scanner_diagnostics').createIndex({ recordedAt: 1 }, { expireAfterSeconds: 604800 });
    console.log('   ✓ scanner_diagnostics indexes verified (7-Day TTL)');

    // scan_dead_letter_queue indexes
    await db.collection('scan_dead_letter_queue').createIndex({ baggageTag: 1 });
    await db.collection('scan_dead_letter_queue').createIndex({ status: 1, failedAt: -1 });
    await db.collection('scan_dead_letter_queue').createIndex({ failedAt: 1 }, { expireAfterSeconds: 1209600 });
    console.log('   ✓ scan_dead_letter_queue indexes verified (14-Day TTL)');

    console.log('\n5. Performing Test Telemetry Write...');
    const testIdempotencyKey = 'ATLAS-VERIFY-' + Date.now();
    const testDoc = {
      idempotencyKey: testIdempotencyKey,
      baggageTag: 'TAG-ATLAS-TEST',
      scannerId: 'SCN-MAA-ATLAS-01',
      handlingPointId: 'MAA-CHECKIN-01',
      scanType: 'SIMULATED_OPTICAL',
      opticalConfidenceScore: 0.99,
      timestamp: new Date(),
      processingOutcome: 'VERIFICATION_TEST',
      metadata: { source: 'CARGOFLIGHT Atlas Verification Script', project: 'CARGOFLIGHT' }
    };

    const insertResult = await db.collection('raw_scanner_events').insertOne(testDoc);
    console.log('   ✓ Inserted test document with ID:', insertResult.insertedId);

    console.log('\n6. Verifying Document Read Back...');
    const readDoc = await db.collection('raw_scanner_events').findOne({ idempotencyKey: testIdempotencyKey });
    console.log('   ✓ Successfully read back test document: tag =', readDoc.baggageTag, '| outcome =', readDoc.processingOutcome);

    const count = await db.collection('raw_scanner_events').countDocuments();
    console.log('\n================================================================');
    console.log(`ALL VERIFICATIONS PASSED! Total events in aerotrace_telemetry: ${count}`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ MongoDB Atlas Verification Failed:');
    if (err.message.includes('AuthenticationFailed') || err.message.includes('auth failed')) {
      console.error('-> Status: AUTHENTICATION FAILED');
      console.error('-> Rationale: Bad username or password in connection string.');
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timed out') || err.message.includes('Server selection timed out')) {
      console.error('-> Status: NETWORK ACCESS DENIED / TIMEOUT');
      console.error('-> Rationale: Current public IP is not in Atlas Network Access whitelist.');
    } else {
      console.error('-> Detail:', err.message);
    }
  } finally {
    await client.close();
  }
}

verifyMongoAtlas();
