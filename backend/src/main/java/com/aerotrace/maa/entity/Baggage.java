package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "baggage")
public class Baggage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "baggage_tag", length = 32, nullable = false, unique = true)
    private String baggageTag;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @Column(name = "passenger_name", length = 128, nullable = false)
    private String passengerName;

    @Column(name = "passenger_pnr", length = 16, nullable = false)
    private String passengerPnr;

    @Column(name = "origin_iata", length = 3, nullable = false)
    private String originIata;

    @Column(name = "destination_iata", length = 3, nullable = false)
    private String destinationIata;

    @Column(name = "weight_kg", precision = 5, scale = 2, nullable = false)
    private BigDecimal weightKg;

    @Column(name = "current_status", length = 32, nullable = false)
    private String currentStatus = "REGISTERED";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_handling_point_id")
    private HandlingPoint currentHandlingPoint;

    @Column(name = "last_scan_time")
    private OffsetDateTime lastScanTime;

    @Column(name = "is_delayed", nullable = false)
    private boolean delayed = false;

    @Column(name = "is_misrouted", nullable = false)
    private boolean misrouted = false;

    @Column(name = "is_rush", nullable = false)
    private boolean rush = false;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private OffsetDateTime registeredAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Baggage() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public Flight getFlight() { return flight; }
    public void setFlight(Flight flight) { this.flight = flight; }

    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }

    public String getPassengerPnr() { return passengerPnr; }
    public void setPassengerPnr(String passengerPnr) { this.passengerPnr = passengerPnr; }

    public String getOriginIata() { return originIata; }
    public void setOriginIata(String originIata) { this.originIata = originIata; }

    public String getDestinationIata() { return destinationIata; }
    public void setDestinationIata(String destinationIata) { this.destinationIata = destinationIata; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public HandlingPoint getCurrentHandlingPoint() { return currentHandlingPoint; }
    public void setCurrentHandlingPoint(HandlingPoint currentHandlingPoint) { this.currentHandlingPoint = currentHandlingPoint; }

    public OffsetDateTime getLastScanTime() { return lastScanTime; }
    public void setLastScanTime(OffsetDateTime lastScanTime) { this.lastScanTime = lastScanTime; }

    public boolean isDelayed() { return delayed; }
    public void setDelayed(boolean delayed) { this.delayed = delayed; }

    public boolean isMisrouted() { return misrouted; }
    public void setMisrouted(boolean misrouted) { this.misrouted = misrouted; }

    public boolean isRush() { return rush; }
    public void setRush(boolean rush) { this.rush = rush; }

    public OffsetDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(OffsetDateTime registeredAt) { this.registeredAt = registeredAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
