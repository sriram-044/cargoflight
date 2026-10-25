package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.ScanResultResponse;
import com.aerotrace.maa.dto.ScannerEventRequest;
import com.aerotrace.maa.entity.Baggage;
import com.aerotrace.maa.entity.BaggageMovementHistory;
import com.aerotrace.maa.entity.Flight;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.integration.mongodb.DeadLetterQueueDocument;
import com.aerotrace.maa.integration.mongodb.MongoTelemetryRepository;
import com.aerotrace.maa.integration.mongodb.RawScannerEventDocument;
import com.aerotrace.maa.repository.BaggageMovementHistoryRepository;
import com.aerotrace.maa.repository.BaggageRepository;
import com.aerotrace.maa.repository.FlightRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class ScanProcessingService {

    private static final Logger log = LoggerFactory.getLogger(ScanProcessingService.class);

    private final BaggageRepository baggageRepository;
    private final HandlingPointRepository handlingPointRepository;
    private final BaggageMovementHistoryRepository historyRepository;
    private final FlightRepository flightRepository;
    private final BaggageService baggageService;

    @Autowired(required = false)
    private MongoTelemetryRepository mongoTelemetryRepository;

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @Value("${aerotrace.mongodb.enabled:false}")
    private boolean mongodbConfigured;

    public ScanProcessingService(BaggageRepository baggageRepository,
                                 HandlingPointRepository handlingPointRepository,
                                 BaggageMovementHistoryRepository historyRepository,
                                 FlightRepository flightRepository,
                                 BaggageService baggageService) {
        this.baggageRepository = baggageRepository;
        this.handlingPointRepository = handlingPointRepository;
        this.historyRepository = historyRepository;
        this.flightRepository = flightRepository;
        this.baggageService = baggageService;
    }

    @Transactional
    public ScanResultResponse processScanEvent(ScannerEventRequest request, String operatorUsername) {
        String tag = request.getBaggageTag().trim().toUpperCase();
        String idempotencyKey = request.getIdempotencyKey();

        ScanResultResponse result = new ScanResultResponse();
        result.setBaggageTag(tag);
        result.setScannerId(request.getScannerId());
        result.setHandlingPointId(request.getHandlingPointId());
        result.setIdempotencyKey(idempotencyKey);

        // 1. Telemetry Ingestion to MongoDB with Idempotency Protection
        boolean mongoPersisted = false;
        boolean isDuplicate = false;

        if (mongodbConfigured && mongoTelemetryRepository != null) {
            try {
                Optional<RawScannerEventDocument> existingEvent = mongoTelemetryRepository.findByIdempotencyKey(idempotencyKey);
                if (existingEvent.isPresent()) {
                    isDuplicate = true;
                    log.warn("Duplicate scanner event detected with idempotency key: {}", idempotencyKey);
                    result.setDuplicate(true);
                    result.setMessage("Duplicate scanner telemetry event detected. Event previously ingested.");
                    result.setTelemetryPersistedMongo(true);
                    return result;
                }

                RawScannerEventDocument rawDoc = new RawScannerEventDocument();
                rawDoc.setIdempotencyKey(idempotencyKey);
                rawDoc.setBaggageTag(tag);
                rawDoc.setScannerId(request.getScannerId());
                rawDoc.setHandlingPointId(request.getHandlingPointId());
                rawDoc.setScanType(request.getScanType());
                rawDoc.setOpticalConfidenceScore(request.getOpticalConfidenceScore());
                rawDoc.setTimestamp(Instant.now());
                rawDoc.setProcessingOutcome("PROCESSED");
                mongoTelemetryRepository.save(rawDoc);
                mongoPersisted = true;
            } catch (Exception ex) {
                log.warn("MongoDB telemetry persistence skipped or failed: {}", ex.getMessage());
                recordDeadLetter(tag, "MongoDB write failure: " + ex.getMessage());
            }
        }
        result.setTelemetryPersistedMongo(mongoPersisted);

        // 2. Authoritative PostgreSQL Lookup
        Baggage baggage = baggageRepository.findByBaggageTag(tag)
                .orElseThrow(() -> new ResourceNotFoundException("Baggage record not found for tag: " + tag));

        HandlingPoint newPoint = handlingPointRepository.findById(request.getHandlingPointId())
                .orElseThrow(() -> new ResourceNotFoundException("Handling point not found: " + request.getHandlingPointId()));

        result.setHandlingPointName(newPoint.getName());

        // Derive next operational status based on handling point category
        String previousStatus = baggage.getCurrentStatus();
        result.setPreviousStatus(previousStatus);

        String nextStatus = mapCategoryToStatus(newPoint.getCategory(), previousStatus);

        // Validate state transition
        baggageService.validateTransition(previousStatus, nextStatus);

        // Update Baggage authoritative record
        HandlingPoint previousPoint = baggage.getCurrentHandlingPoint();
        baggage.setCurrentStatus(nextStatus);
        baggage.setCurrentHandlingPoint(newPoint);
        baggage.setLastScanTime(OffsetDateTime.now());
        baggage.setUpdatedAt(OffsetDateTime.now());

        // If loaded, increment flight loaded bags count
        if ("LOADED".equals(nextStatus) && !"LOADED".equals(previousStatus)) {
            Flight flight = baggage.getFlight();
            if (flight != null) {
                flight.setTotalLoadedBags(flight.getTotalLoadedBags() + 1);
                flightRepository.save(flight);
            }
        }

        baggageRepository.save(baggage);

        // 3. Append-only movement history in PostgreSQL (atomic transaction)
        BaggageMovementHistory history = new BaggageMovementHistory();
        history.setBaggage(baggage);
        history.setBaggageTag(tag);
        history.setHandlingPoint(newPoint);
        history.setPreviousPoint(previousPoint);
        history.setStatusBefore(previousStatus);
        history.setStatusAfter(nextStatus);
        history.setScannerId(request.getScannerId());
        history.setScanType(request.getScanType());
        history.setOperatorUsername(operatorUsername != null ? operatorUsername : "system");
        history.setRecordedAt(OffsetDateTime.now());
        history.setNotes(request.getNotes() != null ? request.getNotes() : "Scan verified at " + newPoint.getName());
        historyRepository.save(history);

        result.setNewStatus(nextStatus);
        result.setOperationalPersistedPostgres(true);
        result.setSuccess(true);
        result.setMessage("Scan processed successfully. Baggage status updated from " + previousStatus + " to " + nextStatus + ".");

        return result;
    }

    private void recordDeadLetter(String tag, String reason) {
        if (mongodbConfigured && mongoTemplate != null) {
            try {
                DeadLetterQueueDocument dlq = new DeadLetterQueueDocument();
                dlq.setBaggageTag(tag);
                dlq.setFailureReason(reason);
                dlq.setFailedAt(Instant.now());
                mongoTemplate.save(dlq);
            } catch (Exception e) {
                log.debug("DLQ storage failed: {}", e.getMessage());
            }
        }
    }

    private String mapCategoryToStatus(String category, String currentStatus) {
        switch (category) {
            case "CHECK_IN": return "CHECKED_IN";
            case "SECURITY": return "SECURITY_CLEARED";
            case "SORTING": return "SORTED";
            case "CONVEYOR": return "IN_TRANSIT";
            case "TRANSFER": return "IN_TRANSIT";
            case "LOADING": return "LOADED";
            case "ARRIVAL": return "ARRIVED";
            case "CLAIM": return "DELIVERED_TO_BELT";
            default: return currentStatus;
        }
    }
}
