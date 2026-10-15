package com.aerotrace.maa.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class ScannerEventRequest {

    @NotBlank(message = "Baggage tag is required")
    private String baggageTag;

    @NotBlank(message = "Scanner ID is required")
    private String scannerId;

    @NotBlank(message = "Handling point ID is required")
    private String handlingPointId;

    private String scanType = "SIMULATED_OPTICAL";

    private String idempotencyKey = UUID.randomUUID().toString();

    private double opticalConfidenceScore = 0.98;

    private String notes;

    public ScannerEventRequest() {}

    // Getters and Setters
    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getHandlingPointId() { return handlingPointId; }
    public void setHandlingPointId(String handlingPointId) { this.handlingPointId = handlingPointId; }

    public String getScanType() { return scanType; }
    public void setScanType(String scanType) { this.scanType = scanType; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public double getOpticalConfidenceScore() { return opticalConfidenceScore; }
    public void setOpticalConfidenceScore(double opticalConfidenceScore) { this.opticalConfidenceScore = opticalConfidenceScore; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
