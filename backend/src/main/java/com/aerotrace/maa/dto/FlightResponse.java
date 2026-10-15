package com.aerotrace.maa.dto;

import java.time.OffsetDateTime;

public class FlightResponse {
    private Long id;
    private String flightNumber;
    private String airlineCode;
    private String airlineName;
    private String originIata;
    private String destinationIata;
    private OffsetDateTime scheduledDeparture;
    private OffsetDateTime scheduledArrival;
    private String terminal;
    private String gate;
    private String status;
    private int totalExpectedBags;
    private int totalLoadedBags;
    private double loadingProgressPercent;

    public FlightResponse() {}

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

    public double getLoadingProgressPercent() { return loadingProgressPercent; }
    public void setLoadingProgressPercent(double loadingProgressPercent) { this.loadingProgressPercent = loadingProgressPercent; }
}
