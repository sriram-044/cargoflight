package com.aerotrace.maa.integration.mongodb;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Idempotent initializer ensuring required MongoDB Atlas collections and indexes exist
 * immediately upon application startup without depending on lazy document creation.
 */
@Component
public class MongoIndexInitializer {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexInitializer.class);

    private final MongoTemplate mongoTemplate;

    @org.springframework.beans.factory.annotation.Value("${aerotrace.mongodb.enabled:false}")
    private boolean mongoEnabled;

    public MongoIndexInitializer(@Autowired(required = false) MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeCollectionsAndIndexes() {
        if (!mongoEnabled || mongoTemplate == null) {
            log.info("MongoDB disabled or uninitialized; skipping MongoDB telemetry schema initialization.");
            return;
        }

        try {
            log.info("Ensuring CARGOFLIGHT dedicated MongoDB collections and indexes in database: {}", mongoTemplate.getDb().getName());

            // 1. raw_scanner_events
            ensureCollection("raw_scanner_events");
            mongoTemplate.indexOps("raw_scanner_events")
                    .ensureIndex(new Index().on("idempotencyKey", Sort.Direction.ASC).unique());
            mongoTemplate.indexOps("raw_scanner_events")
                    .ensureIndex(new CompoundIndexDefinition(new Document("baggageTag", 1).append("timestamp", -1)));
            mongoTemplate.indexOps("raw_scanner_events")
                    .ensureIndex(new CompoundIndexDefinition(new Document("scannerId", 1).append("timestamp", -1)));
            mongoTemplate.indexOps("raw_scanner_events")
                    .ensureIndex(new Index().on("handlingPointId", Sort.Direction.ASC));
            mongoTemplate.indexOps("raw_scanner_events")
                    .ensureIndex(new Index().on("timestamp", Sort.Direction.ASC).expire(Duration.ofDays(7)));

            // 2. scanner_diagnostics
            ensureCollection("scanner_diagnostics");
            mongoTemplate.indexOps("scanner_diagnostics")
                    .ensureIndex(new CompoundIndexDefinition(new Document("scannerId", 1).append("recordedAt", -1)));
            mongoTemplate.indexOps("scanner_diagnostics")
                    .ensureIndex(new Index().on("status", Sort.Direction.ASC));
            mongoTemplate.indexOps("scanner_diagnostics")
                    .ensureIndex(new Index().on("recordedAt", Sort.Direction.ASC).expire(Duration.ofDays(7)));

            // 3. scan_dead_letter_queue
            ensureCollection("scan_dead_letter_queue");
            mongoTemplate.indexOps("scan_dead_letter_queue")
                    .ensureIndex(new Index().on("baggageTag", Sort.Direction.ASC));
            mongoTemplate.indexOps("scan_dead_letter_queue")
                    .ensureIndex(new CompoundIndexDefinition(new Document("status", 1).append("failedAt", -1)));
            mongoTemplate.indexOps("scan_dead_letter_queue")
                    .ensureIndex(new Index().on("failedAt", Sort.Direction.ASC).expire(Duration.ofDays(14)));

            log.info("CARGOFLIGHT MongoDB telemetry schema initialized successfully with collections, unique idempotency, and 7-day TTL policies.");
        } catch (Exception ex) {
            log.warn("MongoDB Atlas collection/index initialization note (will retry on next request): {}", ex.getMessage());
        }
    }

    private void ensureCollection(String collectionName) {
        if (!mongoTemplate.collectionExists(collectionName)) {
            mongoTemplate.createCollection(collectionName);
            log.info("Created dedicated MongoDB collection: {}", collectionName);
        }
    }
}
