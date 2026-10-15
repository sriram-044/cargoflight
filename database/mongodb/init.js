// MongoDB initialization for Aerotrace MAA Telemetry
// Database: aerotrace_telemetry

db = db.getSiblingDB('aerotrace_telemetry');

// Create collections
db.createCollection('raw_scanner_events');
db.createCollection('scanner_diagnostics');
db.createCollection('scan_dead_letter_queue');

// 1. raw_scanner_events: Indexes and Idempotency protection
// Unique index on idempotencyKey to prevent duplicate scan submissions
db.raw_scanner_events.createIndex({ "idempotencyKey": 1 }, { unique: true });
db.raw_scanner_events.createIndex({ "baggageTag": 1, "timestamp": -1 });
db.raw_scanner_events.createIndex({ "scannerId": 1, "timestamp": -1 });
db.raw_scanner_events.createIndex({ "handlingPointId": 1 });
// TTL index: 7-day telemetry retention policy (7 * 24 * 60 * 60 = 604800 seconds)
db.raw_scanner_events.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 604800 });

// 2. scanner_diagnostics
db.scanner_diagnostics.createIndex({ "scannerId": 1, "recordedAt": -1 });
db.scanner_diagnostics.createIndex({ "status": 1 });
db.scanner_diagnostics.createIndex({ "recordedAt": 1 }, { expireAfterSeconds: 604800 });

// 3. scan_dead_letter_queue
db.scan_dead_letter_queue.createIndex({ "baggageTag": 1 });
db.scan_dead_letter_queue.createIndex({ "status": 1, "failedAt": -1 });
db.scan_dead_letter_queue.createIndex({ "failedAt": 1 }, { expireAfterSeconds: 1209600 }); // 14 days retention

print("Aerotrace MAA MongoDB telemetry database initialized successfully with collections, indexes, and 7-day TTL retention.");
