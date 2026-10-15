package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "handling_point_connections", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"from_point_id", "to_point_id"})
})
public class HandlingPointConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_point_id", nullable = false)
    private HandlingPoint fromPoint;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_point_id", nullable = false)
    private HandlingPoint toPoint;

    @Column(name = "distance_meters", precision = 7, scale = 2, nullable = false)
    private BigDecimal distanceMeters;

    @Column(name = "estimated_traversal_seconds", nullable = false)
    private int estimatedTraversalSeconds;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "restriction_notes", length = 255)
    private String restrictionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public HandlingPointConnection() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public HandlingPoint getFromPoint() { return fromPoint; }
    public void setFromPoint(HandlingPoint fromPoint) { this.fromPoint = fromPoint; }

    public HandlingPoint getToPoint() { return toPoint; }
    public void setToPoint(HandlingPoint toPoint) { this.toPoint = toPoint; }

    public BigDecimal getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(BigDecimal distanceMeters) { this.distanceMeters = distanceMeters; }

    public int getEstimatedTraversalSeconds() { return estimatedTraversalSeconds; }
    public void setEstimatedTraversalSeconds(int estimatedTraversalSeconds) { this.estimatedTraversalSeconds = estimatedTraversalSeconds; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getRestrictionNotes() { return restrictionNotes; }
    public void setRestrictionNotes(String restrictionNotes) { this.restrictionNotes = restrictionNotes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
