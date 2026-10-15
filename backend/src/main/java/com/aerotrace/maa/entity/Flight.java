package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "flights")
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_number", length = 16, nullable = false)
    private String flightNumber;

    @Column(name = "airline_code", length = 4, nullable = false)
    private String airlineCode;

    @Column(name = "airline_name", length = 64, nullable = false)
    private String airlineName;

    @Column(name = "origin_iata", length = 3, nullable = false)
    private String originIata;

    @Column(name = "destination_iata", length = 3, nullable = false)
    private String destinationIata;

    @Column(name = "scheduled_departure", nullable = false)
    private OffsetDateTime scheduledDeparture;

    @Column(name = "scheduled_arrival", nullable = false)
    private OffsetDateTime scheduledArrival;

    @Column(name = "terminal", length = 8, nullable = false)
    private String terminal = "T2";

    @Column(name = "gate", length = 16, nullable = false)
    private String gate = "G12";

    @Column(name = "status", length = 32, nullable = false)
    private String status = "SCHEDULED";

    @Column(name = "total_expected_bags", nullable = false)
    private int totalExpectedBags = 0;

    @Column(name = "total_loaded_bags", nullable = false)
    private int totalLoadedBags = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Flight() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getAirlineCode() { return airlineCode; }
    public void setAirlineCode(String airlineCode) { this.airlineCode = airlineCode; }

    public String getAirlineName() { return airlineName; }
    public void setAirlineName(String airlineName) { this.airlineName = airlineName; }

    public String getOriginIata() { return originIata; }
    public void setOriginIata(String originIata) { this.originIata = originIata; }

    public String getDestinationIata() { return destinationIata; }
    public void setDestinationIata(String destinationIata) { this.destinationIata = destinationIata; }

    public OffsetDateTime getScheduledDeparture() { return scheduledDeparture; }
    public void setScheduledDeparture(OffsetDateTime scheduledDeparture) { this.scheduledDeparture = scheduledDeparture; }

    public OffsetDateTime getScheduledArrival() { return scheduledArrival; }
    public void setScheduledArrival(OffsetDateTime scheduledArrival) { this.scheduledArrival = scheduledArrival; }

    public String getTerminal() { return terminal; }
    public void setTerminal(String terminal) { this.terminal = terminal; }

    public String getGate() { return gate; }
    public void setGate(String gate) { this.gate = gate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTotalExpectedBags() { return totalExpectedBags; }
    public void setTotalExpectedBags(int totalExpectedBags) { this.totalExpectedBags = totalExpectedBags; }

    public int getTotalLoadedBags() { return totalLoadedBags; }
    public void setTotalLoadedBags(int totalLoadedBags) { this.totalLoadedBags = totalLoadedBags; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
