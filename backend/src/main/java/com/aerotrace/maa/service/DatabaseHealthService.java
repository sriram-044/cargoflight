package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.DatabaseHealthDto;
import com.aerotrace.maa.dto.DatabaseHealthDto.DatabaseCheckResult;
import com.aerotrace.maa.repository.BaggageRepository;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Health check service enforcing the three-database architecture:
 * 1. PostgreSQL 17: Operational Primary & Analytical Warehouse (cargoflight_dw schema)
 * 2. MongoDB 7.0: Raw Telemetry & Scanner Events
 * 3. Neo4j 5.20: Airport Handling-Point Graph & Routing
 */
@Service
public class DatabaseHealthService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private BaggageRepository baggageRepository;

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @Value("${spring.datasource.url}")
    private String pgUrl;

    @Value("${aerotrace.mongodb.enabled:false}")
    private boolean mongoConfigured;

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/aerotrace_telemetry}")
    private String mongoUri;

    @Value("${aerotrace.neo4j.enabled:false}")
    private boolean neo4jEnabled;

    @Value("${aerotrace.neo4j.uri:bolt://localhost:7687}")
    private String neo4jUri;

    @Value("${aerotrace.neo4j.username:neo4j}")
    private String neo4jUsername;

    @Value("${aerotrace.neo4j.password:aerotrace_neo4j_2026}")
    private String neo4jPassword;

    public DatabaseHealthDto checkAllDatabases() {
        DatabaseHealthDto health = new DatabaseHealthDto();
        health.setCheckedAt(OffsetDateTime.now());

        List<DatabaseCheckResult> results = new ArrayList<>();

        // 1. PostgreSQL 17 (Operational Primary & Analytical Data Warehouse schema cargoflight_dw)
        results.add(checkPostgreSql());

        // 2. MongoDB 7.0 (Raw Scanner Telemetry & IoT Scan Events)
        results.add(checkMongoDb());

        // 3. Neo4j Graph (Handling Point Topology & Path Optimization)
        results.add(checkNeo4j());

        health.setDatabases(results);

        // Core operational requirement: Application is operational if PostgreSQL PASSES
        boolean pgPass = results.stream().anyMatch(r -> "PostgreSQL 17".equals(r.getDatabaseName()) && "PASS".equals(r.getStatus()));
        health.setOverallOperational(pgPass);

        return health;
    }

    private DatabaseCheckResult checkPostgreSql() {
        long start = System.currentTimeMillis();
        String safeEndpoint = sanitizeUrl(pgUrl);
        try {
            Integer testResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            long operationalCount = baggageRepository.count();

            // Also check the warehouse schema components inside the SAME PostgreSQL service
            long warehouseFacts = 0;
            boolean warehousePresent = false;
            try {
                Long dwCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cargoflight_dw.fact_baggage_lifecycle", Long.class);
                if (dwCount != null) {
                    warehouseFacts = dwCount;
                    warehousePresent = true;
                }
            } catch (Exception ex) {
                log.debug("Warehouse schema check note: {}", ex.getMessage());
            }

            long latency = System.currentTimeMillis() - start;

            if (testResult != null && testResult == 1) {
                String detailMessage = "Authoritative operational database connected with " + operationalCount + " baggage records. "
                        + (warehousePresent
                            ? "Dedicated OLAP warehouse schema ('cargoflight_dw') active with " + warehouseFacts + " analytical lifecycle facts."
                            : "Warehouse schema ready for V3 migration refresh.");

                return new DatabaseCheckResult(
                        "PostgreSQL 17",
                        "OPERATIONAL_AND_WAREHOUSE",
                        "PASS",
                        true,
                        safeEndpoint,
                        detailMessage,
                        latency,
                        operationalCount + warehouseFacts
                );
            } else {
                return new DatabaseCheckResult("PostgreSQL 17", "OPERATIONAL_AND_WAREHOUSE", "FAIL", false, safeEndpoint, "Query test failed.", latency, 0);
            }
        } catch (Exception ex) {
            log.error("PostgreSQL health check failed: {}", ex.getMessage());
            return new DatabaseCheckResult(
                    "PostgreSQL 17",
                    "OPERATIONAL_AND_WAREHOUSE",
                    "FAIL",
                    false,
                    safeEndpoint,
                    "Connection refused or authentication failed: " + ex.getMessage(),
                    System.currentTimeMillis() - start,
                    0
            );
        }
    }

    private DatabaseCheckResult checkMongoDb() {
        long start = System.currentTimeMillis();
        boolean isAtlas = mongoUri != null && (mongoUri.contains("mongodb+srv://") || mongoUri.contains(".mongodb.net"));
        String dbDisplayName = isAtlas ? "MongoDB Atlas (Cloud Telemetry)" : "MongoDB 7.0 (Local)";
        String safeEndpoint = sanitizeUrl(mongoUri);

        if (!mongoConfigured && mongoTemplate == null) {
            return new DatabaseCheckResult(
                    dbDisplayName,
                    "TELEMETRY",
                    "NOT CONFIGURED",
                    false,
                    safeEndpoint,
                    "Telemetry service disabled via configuration (aerotrace.mongodb.enabled=false).",
                    0,
                    0
            );
        }

        try {
            if (mongoTemplate != null) {
                org.bson.Document ping = mongoTemplate.executeCommand("{ ping: 1 }");
                long latency = System.currentTimeMillis() - start;
                long rawEventsCount = 0;
                long diagnosticsCount = 0;
                long dlqCount = 0;
                try {
                    rawEventsCount = mongoTemplate.getCollection("raw_scanner_events").countDocuments();
                } catch (Exception ignored) {}
                try {
                    diagnosticsCount = mongoTemplate.getCollection("scanner_diagnostics").countDocuments();
                } catch (Exception ignored) {}
                try {
                    dlqCount = mongoTemplate.getCollection("scan_dead_letter_queue").countDocuments();
                } catch (Exception ignored) {}

                long totalDocs = rawEventsCount + diagnosticsCount + dlqCount;
                String locationDesc = isAtlas ? "MongoDB Atlas dedicated cloud cluster connected" : "Local Docker MongoDB instance online";
                String details = String.format("%s (Database: aerotrace_telemetry). Collections verified: %d raw events (7-day TTL), %d diagnostics, %d DLQ records.",
                        locationDesc, rawEventsCount, diagnosticsCount, dlqCount);

                return new DatabaseCheckResult(
                        dbDisplayName,
                        "TELEMETRY",
                        "PASS",
                        true,
                        safeEndpoint,
                        details,
                        latency,
                        totalDocs
                );
            }
            return new DatabaseCheckResult(dbDisplayName, "TELEMETRY", "DISCONNECTED", false, safeEndpoint, "MongoTemplate bean uninitialized.", 0, 0);
        } catch (Exception ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            String status = "FAIL";
            String errorDetail;

            if (msg.contains("AuthenticationFailed") || msg.contains("auth failed") || ex.getClass().getSimpleName().contains("Security")) {
                status = "AUTHENTICATION FAILED";
                errorDetail = "MongoDB Atlas authentication failed. Verify cargoflight_app credentials in SPRING_DATA_MONGODB_URI.";
            } else if (msg.contains("Timed out") || msg.contains("timeout") || msg.contains("No server chosen") || ex.getClass().getSimpleName().contains("Timeout")) {
                status = "NETWORK ACCESS DENIED";
                errorDetail = "Connection timed out. Ensure your current public IP is added to MongoDB Atlas Network Access whitelist.";
            } else {
                status = "DISCONNECTED";
                errorDetail = "MongoDB connection failed: " + ex.getClass().getSimpleName() + " - " + (msg.length() > 80 ? msg.substring(0, 80) + "..." : msg);
            }

            return new DatabaseCheckResult(
                    dbDisplayName,
                    "TELEMETRY",
                    status,
                    false,
                    safeEndpoint,
                    errorDetail,
                    System.currentTimeMillis() - start,
                    0
            );
        }
    }

    private DatabaseCheckResult checkNeo4j() {
        long start = System.currentTimeMillis();
        String safeEndpoint = sanitizeUrl(neo4jUri);

        if (!neo4jEnabled) {
            return new DatabaseCheckResult(
                    "Neo4j Graph",
                    "GRAPH_ROUTING",
                    "NOT CONFIGURED",
                    false,
                    safeEndpoint,
                    "Neo4j integration disabled in configuration. Using deterministic PostgreSQL graph topology solver fallback.",
                    0,
                    0
            );
        }

        try (Driver driver = GraphDatabase.driver(neo4jUri, AuthTokens.basic(neo4jUsername, neo4jPassword));
             Session session = driver.session()) {
            var result = session.run("MATCH (n:HandlingPoint) WITH count(n) AS nodeCount OPTIONAL MATCH ()-[r:CONNECTED_TO]->() RETURN nodeCount, count(r) AS edgeCount");
            long nodeCount = 0;
            long edgeCount = 0;
            if (result.hasNext()) {
                var record = result.next();
                nodeCount = record.get("nodeCount").asLong();
                edgeCount = record.get("edgeCount").asLong();
            }
            long latency = System.currentTimeMillis() - start;

            return new DatabaseCheckResult(
                    "Neo4j Graph",
                    "GRAPH_ROUTING",
                    "PASS",
                    true,
                    safeEndpoint,
                    "Neo4j Bolt connection verified with " + nodeCount + " HandlingPoint graph nodes and " + edgeCount + " topology conveyor edges.",
                    latency,
                    nodeCount + edgeCount
            );
        } catch (Exception ex) {
            return new DatabaseCheckResult(
                    "Neo4j Graph",
                    "GRAPH_ROUTING",
                    "FAIL",
                    false,
                    safeEndpoint,
                    "Neo4j Bolt connection failed: " + ex.getMessage() + ". PostgreSQL topology solver will handle routing requests.",
                    System.currentTimeMillis() - start,
                    0
            );
        }
    }

    private String sanitizeUrl(String url) {
        if (url == null) return "N/A";
        return url.replaceAll(":[^:@]+@", ":***@").replaceAll("\\?.*", "");
    }
}
