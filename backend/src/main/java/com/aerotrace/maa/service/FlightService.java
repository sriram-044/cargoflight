package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.FlightResponse;
import com.aerotrace.maa.entity.AuditLog;
import com.aerotrace.maa.entity.Flight;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.AuditLogRepository;
import com.aerotrace.maa.repository.BaggageRepository;
import com.aerotrace.maa.repository.FlightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlightService {

    private final FlightRepository flightRepository;
    private final BaggageRepository baggageRepository;
    private final AuditLogRepository auditLogRepository;

    public FlightService(FlightRepository flightRepository,
                         BaggageRepository baggageRepository,
                         AuditLogRepository auditLogRepository) {
        this.flightRepository = flightRepository;
        this.baggageRepository = baggageRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<FlightResponse> getAllMaaFlights() {
        return flightRepository.findAllMaaFlights().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FlightResponse getFlightById(Long id) {
        Flight f = flightRepository.findById(id)
                .orElseThrow(() -> new com.aerotrace.maa.exception.ResourceNotFoundException("Flight not found with id: " + id));
        return toResponse(f);
    }

    @Transactional(readOnly = true)
    public List<com.aerotrace.maa.dto.BaggageResponse> getFlightBaggage(Long id) {
        Flight f = flightRepository.findById(id)
                .orElseThrow(() -> new com.aerotrace.maa.exception.ResourceNotFoundException("Flight not found with id: " + id));

        return baggageRepository.findByFlightId(f.getId()).stream().map(b -> {
            com.aerotrace.maa.dto.BaggageResponse dto = new com.aerotrace.maa.dto.BaggageResponse();
            dto.setId(b.getId());
            dto.setBaggageTag(b.getBaggageTag());
            dto.setFlightId(f.getId());
            dto.setFlightNumber(f.getFlightNumber());
            dto.setAirlineName(f.getAirlineName());
            dto.setPassengerName(b.getPassengerName());
            dto.setPassengerPnr(b.getPassengerPnr());
            dto.setOriginIata(b.getOriginIata());
            dto.setDestinationIata(b.getDestinationIata());
            dto.setWeightKg(b.getWeightKg());
            dto.setCurrentStatus(b.getCurrentStatus());
            if (b.getCurrentHandlingPoint() != null) {
                dto.setCurrentHandlingPointId(b.getCurrentHandlingPoint().getId());
                dto.setCurrentHandlingPointName(b.getCurrentHandlingPoint().getName());
            }
            dto.setLastScanTime(b.getLastScanTime());
            dto.setDelayed(b.isDelayed());
            dto.setMisrouted(b.isMisrouted());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public FlightResponse createFlight(Flight f, String username) {
        if (f.getFlightNumber() == null || f.getFlightNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Flight number is required");
        }
        f.setFlightNumber(f.getFlightNumber().trim().toUpperCase());
        if (f.getOriginIata() == null || f.getDestinationIata() == null) {
            throw new IllegalArgumentException("Origin and Destination IATA codes are required");
        }
        f.setOriginIata(f.getOriginIata().trim().toUpperCase());
        f.setDestinationIata(f.getDestinationIata().trim().toUpperCase());
        if (!"MAA".equals(f.getOriginIata()) && !"MAA".equals(f.getDestinationIata())) {
            throw new IllegalArgumentException("At least one endpoint must be the authoritative hub MAA");
        }

        if (f.getScheduledDeparture() == null) {
            f.setScheduledDeparture(java.time.OffsetDateTime.now().plusHours(2));
        }
        if (f.getScheduledArrival() == null) {
            f.setScheduledArrival(f.getScheduledDeparture().plusHours(2).plusMinutes(30));
        }
        if (f.getTerminal() == null) f.setTerminal("T2");
        if (f.getGate() == null) f.setGate("G12");
        if (f.getStatus() == null) f.setStatus("SCHEDULED");

        Flight saved = flightRepository.save(f);

        auditLogRepository.save(new com.aerotrace.maa.entity.AuditLog(
                username != null ? username : "system",
                "FLIGHT_CREATED",
                "Flight",
                saved.getId().toString(),
                "Flight " + saved.getFlightNumber() + " (" + saved.getOriginIata() + " -> " + saved.getDestinationIata() + ") scheduled",
                "internal"
        ));

        return toResponse(saved);
    }

    @Transactional
    public FlightResponse updateFlightStatus(Long id, String newStatus, String username) {
        Flight f = flightRepository.findById(id)
                .orElseThrow(() -> new com.aerotrace.maa.exception.ResourceNotFoundException("Flight not found with id: " + id));

        String oldStatus = f.getStatus();
        f.setStatus(newStatus.trim().toUpperCase());
        f.setUpdatedAt(java.time.OffsetDateTime.now());
        Flight saved = flightRepository.save(f);

        auditLogRepository.save(new com.aerotrace.maa.entity.AuditLog(
                username != null ? username : "system",
                "FLIGHT_STATUS_UPDATED",
                "Flight",
                saved.getId().toString(),
                "Flight " + saved.getFlightNumber() + " status transitioned from " + oldStatus + " to " + saved.getStatus(),
                "internal"
        ));

        return toResponse(saved);
    }

    private FlightResponse toResponse(Flight f) {
        FlightResponse dto = new FlightResponse();
        dto.setId(f.getId());
        dto.setFlightNumber(f.getFlightNumber());
        dto.setAirlineCode(f.getAirlineCode());
        dto.setAirlineName(f.getAirlineName());
        dto.setOriginIata(f.getOriginIata());
        dto.setDestinationIata(f.getDestinationIata());
        dto.setScheduledDeparture(f.getScheduledDeparture());
        dto.setScheduledArrival(f.getScheduledArrival());
        dto.setTerminal(f.getTerminal());
        dto.setGate(f.getGate());
        dto.setStatus(f.getStatus());
        dto.setTotalExpectedBags(f.getTotalExpectedBags());
        dto.setTotalLoadedBags(f.getTotalLoadedBags());

        double progress = f.getTotalExpectedBags() > 0
                ? Math.min(100.0, (double) f.getTotalLoadedBags() / f.getTotalExpectedBags() * 100.0)
                : 0.0;
        dto.setLoadingProgressPercent(Math.round(progress * 10.0) / 10.0);

        return dto;
    }
}
