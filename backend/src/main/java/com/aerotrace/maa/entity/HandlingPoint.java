package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "handling_points")
public class HandlingPoint {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id; // e.g. MAA-CHECKIN-01

    @Column(name = "airport_code", length = 3, nullable = false)
    private String airportCode = "MAA";

    @Column(name = "name", length = 128, nullable = false)
    private String name;

    @Column(name = "category", length = 32, nullable = false)
    private String category; // CHECK_IN, SECURITY, SORTING, CONVEYOR, TRANSFER, LOADING, ARRIVAL, CLAIM

    @Column(name = "zone", length = 64, nullable = false)
    private String zone;

    @Column(name = "operational_status", length = 16, nullable = false)
    private String operationalStatus = "ACTIVE"; // ACTIVE, DEGRADED, MAINTENANCE, OFFLINE

    @Column(name = "capacity_per_hour", nullable = false)
    private int capacityPerHour = 1000;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public HandlingPoint() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAirportCode() { return airportCode; }
    public void setAirportCode(String airportCode) { this.airportCode = airportCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public int getCapacityPerHour() { return capacityPerHour; }
    public void setCapacityPerHour(int capacityPerHour) { this.capacityPerHour = capacityPerHour; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
