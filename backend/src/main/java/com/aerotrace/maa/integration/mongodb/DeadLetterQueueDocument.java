package com.aerotrace.maa.integration.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "scan_dead_letter_queue")
public class DeadLetterQueueDocument {

    @Id
    private String id;

    @Indexed
    private String baggageTag;

    private String rawPayload;

    private String failureReason;

    private String stackTrace;

    private int retryCount = 0;

    @Indexed
    private String status = "UNRESOLVED"; // UNRESOLVED, RETRIED, DISMISSED

    @Indexed(expireAfter = "1209600s") // 14-day retention
    private Instant failedAt = Instant.now();

    public DeadLetterQueueDocument() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getFailedAt() { return failedAt; }
    public void setFailedAt(Instant failedAt) { this.failedAt = failedAt; }
}
