package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "baggage_movement_history")
public class BaggageMovementHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baggage_id", nullable = false)
    private Baggage baggage;

    @Column(name = "baggage_tag", length = 32, nullable = false)
    private String baggageTag;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "handling_point_id", nullable = false)
    private HandlingPoint handlingPoint;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "previous_point_id")
    private HandlingPoint previousPoint;

    @Column(name = "status_before", length = 32, nullable = false)
    private String statusBefore;

    @Column(name = "status_after", length = 32, nullable = false)
    private String statusAfter;

    @Column(name = "scanner_id", length = 32)
    private String scannerId;

    @Column(name = "scan_type", length = 32, nullable = false)
    private String scanType = "SIMULATED_OPTICAL";

    @Column(name = "operator_username", length = 64, nullable = false)
    private String operatorUsername = "system";

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private OffsetDateTime recordedAt = OffsetDateTime.now();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public BaggageMovementHistory() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public Baggage getBaggage() { return baggage; }
    public void setBaggage(Baggage baggage) { this.baggage = baggage; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public HandlingPoint getHandlingPoint() { return handlingPoint; }
    public void setHandlingPoint(HandlingPoint handlingPoint) { this.handlingPoint = handlingPoint; }

    public HandlingPoint getPreviousPoint() { return previousPoint; }
    public void setPreviousPoint(HandlingPoint previousPoint) { this.previousPoint = previousPoint; }

    public String getStatusBefore() { return statusBefore; }
    public void setStatusBefore(String statusBefore) { this.statusBefore = statusBefore; }

    public String getStatusAfter() { return statusAfter; }
    public void setStatusAfter(String statusAfter) { this.statusAfter = statusAfter; }

    public String getScannerId() { return scannerId; }
    public void setScannerId(String scannerId) { this.scannerId = scannerId; }

    public String getScanType() { return scanType; }
    public void setScanType(String scanType) { this.scanType = scanType; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public OffsetDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(OffsetDateTime recordedAt) { this.recordedAt = recordedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
