package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "baggage_exceptions")
public class BaggageException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baggage_id", nullable = false)
    private Baggage baggage;

    @Column(name = "baggage_tag", length = 32, nullable = false)
    private String baggageTag;

    @Column(name = "exception_type", length = 32, nullable = false)
    private String exceptionType; // SECURITY_REJECT, MISROUTED, CONVEYOR_JAM, OVERSIZED_MANUAL, UNKNOWN_TAG, TAG_DAMAGED

    @Column(name = "severity", length = 16, nullable = false)
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "handling_point_id", nullable = false)
    private HandlingPoint handlingPoint;

    @Column(name = "status", length = 16, nullable = false)
    private String status = "OPEN"; // OPEN, IN_INVESTIGATION, RESOLVED, DISMISSED

    @Column(name = "reported_at", nullable = false, updatable = false)
    private OffsetDateTime reportedAt = OffsetDateTime.now();

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "resolved_by", length = 64)
    private String resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    public BaggageException() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public Baggage getBaggage() { return baggage; }
    public void setBaggage(Baggage baggage) { this.baggage = baggage; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public String getExceptionType() { return exceptionType; }
    public void setExceptionType(String exceptionType) { this.exceptionType = exceptionType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public HandlingPoint getHandlingPoint() { return handlingPoint; }
    public void setHandlingPoint(HandlingPoint handlingPoint) { this.handlingPoint = handlingPoint; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(OffsetDateTime reportedAt) { this.reportedAt = reportedAt; }

    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
