package com.aerotrace.maa.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class BaggageRegistrationRequest {

    @NotBlank(message = "Baggage tag identifier is required")
    @Size(min = 6, max = 32, message = "Baggage tag must be between 6 and 32 characters")
    private String baggageTag;

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger PNR is required")
    @Size(min = 6, max = 8, message = "PNR must be between 6 and 8 characters")
    private String passengerPnr;

    @NotBlank(message = "Origin airport code is required")
    @Size(min = 3, max = 3, message = "Origin must be 3-letter IATA code")
    private String originIata = "MAA";

    @NotBlank(message = "Destination airport code is required")
    @Size(min = 3, max = 3, message = "Destination must be 3-letter IATA code")
    private String destinationIata;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "0.5", message = "Weight must be at least 0.5 kg")
    private BigDecimal weightKg;

    private String initialHandlingPointId = "MAA-CHECKIN-01";

    public BaggageRegistrationRequest() {}

    // Getters and Setters
    public String getBaggageTag() { return baggageTag; }
    public void setBaggageTag(String baggageTag) { this.baggageTag = baggageTag; }

    public Long getFlightId() { return flightId; }
    public void setFlightId(Long flightId) { this.flightId = flightId; }

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

    public String getInitialHandlingPointId() { return initialHandlingPointId; }
    public void setInitialHandlingPointId(String initialHandlingPointId) { this.initialHandlingPointId = initialHandlingPointId; }
}
