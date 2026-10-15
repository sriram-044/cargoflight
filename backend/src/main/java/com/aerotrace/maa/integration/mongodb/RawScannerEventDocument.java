package com.aerotrace.maa.integration.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "raw_scanner_events")
@CompoundIndex(name = "idx_bag_ts", def = "{'baggageTag': 1, 'timestamp': -1}")
public class RawScannerEventDocument {

    @Id
    private String id;

    private String idempotencyKey;

    private String baggageTag;

    private String scannerId;

    @Indexed
    private String handlingPointId;

    private String scanType; // FIXED_BARCODE, FIXED_RFID, MOBILE_TERMINAL

    private double opticalConfidenceScore;

    private String rawPayload;

    private Map<String, Object> metadata;

    @Indexed(expireAfter = "604800s") // 7-day TTL retention
    private Instant timestamp = Instant.now();

    private String processingOutcome; // PROCESSED, REJECTED, DUPLICATE_IGNORED, SENT_TO_DLQ

    public RawScannerEventDocument() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getHandlingPointId() { return handlingPointId; }
    public void setHandlingPointId(String handlingPointId) { this.handlingPointId = handlingPointId; }

    public String getScanType() { return scanType; }
    public void setScanType(String scanType) { this.scanType = scanType; }

    public double getOpticalConfidenceScore() { return opticalConfidenceScore; }
    public void setOpticalConfidenceScore(double opticalConfidenceScore) { this.opticalConfidenceScore = opticalConfidenceScore; }

    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getProcessingOutcome() { return processingOutcome; }
    public void setProcessingOutcome(String processingOutcome) { this.processingOutcome = processingOutcome; }
}
