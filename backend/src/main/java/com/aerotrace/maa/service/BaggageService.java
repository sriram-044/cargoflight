package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.BaggageMovementDto;
import com.aerotrace.maa.dto.BaggageRegistrationRequest;
import com.aerotrace.maa.dto.BaggageResponse;
import com.aerotrace.maa.entity.*;
import com.aerotrace.maa.exception.DuplicateTagException;
import com.aerotrace.maa.exception.InvalidStateTransitionException;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BaggageService {

    private final BaggageRepository baggageRepository;
    private final FlightRepository flightRepository;
    private final HandlingPointRepository handlingPointRepository;
    private final BaggageMovementHistoryRepository historyRepository;
    private final AuditLogRepository auditLogRepository;

    // Allowed linear workflow transitions
    private static final Map<String, Set<String>> VALID_TRANSITIONS = new HashMap<>();

    static {
        VALID_TRANSITIONS.put("REGISTERED", Set.of("CHECKED_IN", "EXCEPTION"));
        VALID_TRANSITIONS.put("CHECKED_IN", Set.of("SECURITY_CLEARED", "SECURITY_HELD", "EXCEPTION"));
        VALID_TRANSITIONS.put("SECURITY_HELD", Set.of("SECURITY_CLEARED", "EXCEPTION"));
        VALID_TRANSITIONS.put("SECURITY_CLEARED", Set.of("SORTED", "IN_TRANSIT", "EXCEPTION"));
        VALID_TRANSITIONS.put("SORTED", Set.of("READY_FOR_LOADING", "IN_TRANSIT", "EXCEPTION"));
        VALID_TRANSITIONS.put("IN_TRANSIT", Set.of("SORTED", "READY_FOR_LOADING", "LOADED", "EXCEPTION"));
        VALID_TRANSITIONS.put("READY_FOR_LOADING", Set.of("LOADED", "EXCEPTION"));
        VALID_TRANSITIONS.put("LOADED", Set.of("ARRIVED", "EXCEPTION"));
        VALID_TRANSITIONS.put("ARRIVED", Set.of("DELIVERED_TO_BELT", "CLAIMED", "EXCEPTION"));
        VALID_TRANSITIONS.put("DELIVERED_TO_BELT", Set.of("CLAIMED", "EXCEPTION"));
        VALID_TRANSITIONS.put("CLAIMED", Collections.emptySet());
        VALID_TRANSITIONS.put("EXCEPTION", Set.of("CHECKED_IN", "SECURITY_CLEARED", "SORTED", "READY_FOR_LOADING", "LOADED"));
    }

    public BaggageService(BaggageRepository baggageRepository,
                          FlightRepository flightRepository,
                          HandlingPointRepository handlingPointRepository,
                          BaggageMovementHistoryRepository historyRepository,
                          AuditLogRepository auditLogRepository) {
        this.baggageRepository = baggageRepository;
        this.flightRepository = flightRepository;
        this.handlingPointRepository = handlingPointRepository;
        this.historyRepository = historyRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public BaggageResponse registerBaggage(BaggageRegistrationRequest request, String username) {
        if (baggageRepository.existsByBaggageTag(request.getBaggageTag().trim().toUpperCase())) {
            throw new DuplicateTagException("Baggage tag '" + request.getBaggageTag() + "' already exists in the system.");
        }

        Flight flight = flightRepository.findById(request.getFlightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with ID: " + request.getFlightId()));

        HandlingPoint initialPoint = handlingPointRepository.findById(request.getInitialHandlingPointId())
                .orElse(handlingPointRepository.findById("MAA-CHECKIN-01").orElse(null));

        Baggage baggage = new Baggage();
        baggage.setBaggageTag(request.getBaggageTag().trim().toUpperCase());
        baggage.setFlight(flight);
        baggage.setPassengerName(request.getPassengerName().trim());
        baggage.setPassengerPnr(request.getPassengerPnr().trim().toUpperCase());
        baggage.setOriginIata(request.getOriginIata().trim().toUpperCase());
        baggage.setDestinationIata(request.getDestinationIata().trim().toUpperCase());
        baggage.setWeightKg(request.getWeightKg());
        baggage.setCurrentStatus("REGISTERED");
        baggage.setCurrentHandlingPoint(initialPoint);
        baggage.setLastScanTime(OffsetDateTime.now());

        Baggage savedBaggage = baggageRepository.save(baggage);

        // Update flight total expected bags count
        flight.setTotalExpectedBags(flight.getTotalExpectedBags() + 1);
        flightRepository.save(flight);

        // Create initial movement history record
        BaggageMovementHistory initialMovement = new BaggageMovementHistory();
        initialMovement.setBaggage(savedBaggage);
        initialMovement.setBaggageTag(savedBaggage.getBaggageTag());
        initialMovement.setHandlingPoint(initialPoint);
        initialMovement.setStatusBefore("NONE");
        initialMovement.setStatusAfter("REGISTERED");
        initialMovement.setScanType("MANUAL_ENTRY");
        initialMovement.setOperatorUsername(username != null ? username : "system");
        initialMovement.setNotes("Baggage manifest registered at MAA Terminal 2");
        historyRepository.save(initialMovement);

        // Audit log
        auditLogRepository.save(new AuditLog(
                username != null ? username : "system",
                "BAGGAGE_REGISTERED",
                "Baggage",
                savedBaggage.getBaggageTag(),
                "Registered for flight " + flight.getFlightNumber() + " (" + baggage.getOriginIata() + " -> " + baggage.getDestinationIata() + ")",
                "internal"
        ));

        return toResponse(savedBaggage, List.of(toMovementDto(initialMovement)));
    }

    @Transactional(readOnly = true)
    public BaggageResponse getByTag(String baggageTag) {
        Baggage baggage = baggageRepository.findByBaggageTag(baggageTag.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Baggage not found with tag: " + baggageTag));

        List<BaggageMovementHistory> history = historyRepository.findByBaggageTagOrderByRecordedAtAsc(baggage.getBaggageTag());
        List<BaggageMovementDto> historyDtos = history.stream().map(this::toMovementDto).collect(Collectors.toList());

        return toResponse(baggage, historyDtos);
    }

    @Transactional(readOnly = true)
    public Page<BaggageResponse> searchBaggage(String query, String status, Long flightId, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) ? status.trim() : null;
        Page<Baggage> baggagePage = baggageRepository.searchBaggage(cleanQuery, cleanStatus, flightId, pageable);
        return baggagePage.map(b -> toResponse(b, Collections.emptyList()));
    }

    public void validateTransition(String currentStatus, String targetStatus) {
        Set<String> allowed = VALID_TRANSITIONS.get(currentStatus);
        if (allowed == null || !allowed.contains(targetStatus)) {
            throw new InvalidStateTransitionException("Illegal status transition from '" + currentStatus + "' to '" + targetStatus + "' for MAA operational workflow.");
        }
    }

    @Transactional
    public BaggageResponse transitionStatus(String baggageTag, com.aerotrace.maa.dto.BaggageTransitionRequest request, String username) {
        Baggage baggage = baggageRepository.findByBaggageTag(baggageTag.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Baggage not found with tag: " + baggageTag));

        String oldStatus = baggage.getCurrentStatus();
        String targetStatus = request.getTargetStatus().trim().toUpperCase();

        validateTransition(oldStatus, targetStatus);

        HandlingPoint oldPoint = baggage.getCurrentHandlingPoint();
        HandlingPoint newPoint = oldPoint;

        if (request.getHandlingPointId() != null && !request.getHandlingPointId().isBlank()) {
            newPoint = handlingPointRepository.findById(request.getHandlingPointId().trim())
                    .orElse(oldPoint);
        }

        baggage.setCurrentStatus(targetStatus);
        baggage.setCurrentHandlingPoint(newPoint);
        baggage.setLastScanTime(OffsetDateTime.now());
        baggage.setUpdatedAt(OffsetDateTime.now());

        if ("LOADED".equals(targetStatus) && !"LOADED".equals(oldStatus) && baggage.getFlight() != null) {
            Flight flight = baggage.getFlight();
            flight.setTotalLoadedBags(flight.getTotalLoadedBags() + 1);
            flightRepository.save(flight);
        }

        Baggage saved = baggageRepository.save(baggage);

        BaggageMovementHistory movement = new BaggageMovementHistory();
        movement.setBaggage(saved);
        movement.setBaggageTag(saved.getBaggageTag());
        movement.setPreviousPoint(oldPoint);
        movement.setHandlingPoint(newPoint);
        movement.setStatusBefore(oldStatus);
        movement.setStatusAfter(targetStatus);
        movement.setScannerId(request.getScannerId() != null ? request.getScannerId() : "MANUAL_CONSOLE");
        movement.setScanType("OPERATOR_TRANSITION");
        movement.setOperatorUsername(username != null ? username : "system");
        movement.setNotes(request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes()
                : "Manual stage transition from " + oldStatus + " to " + targetStatus);
        historyRepository.save(movement);

        auditLogRepository.save(new AuditLog(
                username != null ? username : "system",
                "BAGGAGE_STAGE_TRANSITION",
                "Baggage",
                saved.getBaggageTag(),
                "Status moved from " + oldStatus + " to " + targetStatus + " at " + (newPoint != null ? newPoint.getName() : "Unknown"),
                "internal"
        ));

        List<BaggageMovementHistory> history = historyRepository.findByBaggageTagOrderByRecordedAtAsc(saved.getBaggageTag());
        List<BaggageMovementDto> historyDtos = history.stream().map(this::toMovementDto).collect(Collectors.toList());

        return toResponse(saved, historyDtos);
    }

    public BaggageResponse toResponse(Baggage baggage, List<BaggageMovementDto> history) {
        BaggageResponse dto = new BaggageResponse();
        dto.setId(baggage.getId());
        dto.setBaggageTag(baggage.getBaggageTag());
        if (baggage.getFlight() != null) {
            dto.setFlightId(baggage.getFlight().getId());
            dto.setFlightNumber(baggage.getFlight().getFlightNumber());
            dto.setAirlineName(baggage.getFlight().getAirlineName());
        }
        dto.setPassengerName(baggage.getPassengerName());
        dto.setPassengerPnr(baggage.getPassengerPnr());
        dto.setOriginIata(baggage.getOriginIata());
        dto.setDestinationIata(baggage.getDestinationIata());
        dto.setWeightKg(baggage.getWeightKg());
        dto.setCurrentStatus(baggage.getCurrentStatus());
        if (baggage.getCurrentHandlingPoint() != null) {
            dto.setCurrentHandlingPointId(baggage.getCurrentHandlingPoint().getId());
            dto.setCurrentHandlingPointName(baggage.getCurrentHandlingPoint().getName());
        }
        dto.setLastScanTime(baggage.getLastScanTime());
        dto.setDelayed(baggage.isDelayed());
        dto.setMisrouted(baggage.isMisrouted());
        dto.setRush(baggage.isRush());
        dto.setRegisteredAt(baggage.getRegisteredAt());
        dto.setUpdatedAt(baggage.getUpdatedAt());
        dto.setMovementHistory(history);

        // Derive expected next handling point
        determineNextExpectedPoint(baggage, dto);

        return dto;
    }

    private void determineNextExpectedPoint(Baggage baggage, BaggageResponse dto) {
        String current = baggage.getCurrentStatus();
        switch (current) {
            case "REGISTERED":
                dto.setExpectedNextHandlingPointId("MAA-CHECKIN-01");
                dto.setExpectedNextHandlingPointName("Check-in Desks Terminal 2 Zone A");
                break;
            case "CHECKED_IN":
                dto.setExpectedNextHandlingPointId("MAA-SECURITY-01");
                dto.setExpectedNextHandlingPointName("Standard Screening Level 1 X-Ray");
                break;
            case "SECURITY_CLEARED":
                dto.setExpectedNextHandlingPointId("MAA-SORTING-01");
                dto.setExpectedNextHandlingPointName("Automated Main Sorter Core Loop");
                break;
            case "SORTED":
                dto.setExpectedNextHandlingPointId("MAA-CONVEYOR-01");
                dto.setExpectedNextHandlingPointName("Main Inter-Pier High-Speed Belt");
                break;
            case "IN_TRANSIT":
                dto.setExpectedNextHandlingPointId("MAA-LOADING-01");
                dto.setExpectedNextHandlingPointName("Airside Tug Cart Make-up Carousel 01");
                break;
            case "READY_FOR_LOADING":
                dto.setExpectedNextHandlingPointId("MAA-LOADING-01");
                dto.setExpectedNextHandlingPointName("Airside Tug Cart Make-up Carousel 01");
                break;
            case "LOADED":
                dto.setExpectedNextHandlingPointId("FLIGHT_DEPARTURE");
                dto.setExpectedNextHandlingPointName("Aircraft Cargo Hold Loaded");
                break;
            case "ARRIVED":
                dto.setExpectedNextHandlingPointId("MAA-CLAIM-01");
                dto.setExpectedNextHandlingPointName("Domestic Reclaim Carousel Belt 03");
                break;
            case "DELIVERED_TO_BELT":
                dto.setExpectedNextHandlingPointId("PASSENGER_COLLECTION");
                dto.setExpectedNextHandlingPointName("Passenger Baggage Reclaim");
                break;
            default:
                dto.setExpectedNextHandlingPointId("N/A");
                dto.setExpectedNextHandlingPointName("Investigation / Terminal Resolution");
        }
    }

    private BaggageMovementDto toMovementDto(BaggageMovementHistory history) {
        BaggageMovementDto dto = new BaggageMovementDto();
        dto.setId(history.getId());
        dto.setBaggageTag(history.getBaggageTag());
        if (history.getHandlingPoint() != null) {
            dto.setHandlingPointId(history.getHandlingPoint().getId());
            dto.setHandlingPointName(history.getHandlingPoint().getName());
        }
        if (history.getPreviousPoint() != null) {
            dto.setPreviousPointId(history.getPreviousPoint().getId());
            dto.setPreviousPointName(history.getPreviousPoint().getName());
        }
        dto.setStatusBefore(history.getStatusBefore());
        dto.setStatusAfter(history.getStatusAfter());
        dto.setScannerId(history.getScannerId());
        dto.setScanType(history.getScanType());
        dto.setOperatorUsername(history.getOperatorUsername());
        dto.setRecordedAt(history.getRecordedAt());
        dto.setNotes(history.getNotes());
        return dto;
    }
}
