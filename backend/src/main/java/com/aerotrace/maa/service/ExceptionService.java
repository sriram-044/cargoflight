package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.ExceptionDto;
import com.aerotrace.maa.entity.AuditLog;
import com.aerotrace.maa.entity.Baggage;
import com.aerotrace.maa.entity.BaggageException;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.AuditLogRepository;
import com.aerotrace.maa.repository.BaggageExceptionRepository;
import com.aerotrace.maa.repository.BaggageRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExceptionService {

    private final BaggageExceptionRepository exceptionRepository;
    private final BaggageRepository baggageRepository;
    private final HandlingPointRepository handlingPointRepository;
    private final AuditLogRepository auditLogRepository;

    public ExceptionService(BaggageExceptionRepository exceptionRepository,
                            BaggageRepository baggageRepository,
                            HandlingPointRepository handlingPointRepository,
                            AuditLogRepository auditLogRepository) {
        this.exceptionRepository = exceptionRepository;
        this.baggageRepository = baggageRepository;
        this.handlingPointRepository = handlingPointRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<ExceptionDto> getAllExceptions() {
        return exceptionRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ExceptionDto> getExceptionsByStatus(String status, Pageable pageable) {
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return exceptionRepository.findByStatus(status, pageable).map(this::toDto);
        }
        return exceptionRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public ExceptionDto createException(String baggageTag, String type, String severity, String description, String pointId, String username) {
        Baggage baggage = baggageRepository.findByBaggageTag(baggageTag)
                .orElseThrow(() -> new ResourceNotFoundException("Baggage tag not found: " + baggageTag));

        HandlingPoint point = handlingPointRepository.findById(pointId)
                .orElseThrow(() -> new ResourceNotFoundException("Handling point not found: " + pointId));

        BaggageException ex = new BaggageException();
        ex.setBaggage(baggage);
        ex.setBaggageTag(baggageTag);
        ex.setExceptionType(type);
        ex.setSeverity(severity);
        ex.setDescription(description);
        ex.setHandlingPoint(point);
        ex.setStatus("OPEN");
        ex.setReportedAt(OffsetDateTime.now());

        // Update baggage exception flags
        baggage.setCurrentStatus("EXCEPTION");
        if ("MISROUTED".equalsIgnoreCase(type)) baggage.setMisrouted(true);
        if ("DELAYED".equalsIgnoreCase(type) || "SECURITY_REJECT".equalsIgnoreCase(type)) baggage.setDelayed(true);
        baggageRepository.save(baggage);

        BaggageException saved = exceptionRepository.save(ex);

        auditLogRepository.save(new AuditLog(
                username != null ? username : "system",
                "EXCEPTION_RAISED",
                "BaggageException",
                saved.getId().toString(),
                "Exception " + type + " raised for tag " + baggageTag,
                "internal"
        ));

        return toDto(saved);
    }

    @Transactional
    public ExceptionDto resolveException(Long exceptionId, String resolutionNotes, String username) {
        BaggageException ex = exceptionRepository.findById(exceptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Exception record not found with ID: " + exceptionId));

        ex.setStatus("RESOLVED");
        ex.setResolvedAt(OffsetDateTime.now());
        ex.setResolvedBy(username);
        ex.setResolutionNotes(resolutionNotes);

        BaggageException saved = exceptionRepository.save(ex);

        auditLogRepository.save(new AuditLog(
                username != null ? username : "system",
                "EXCEPTION_RESOLVED",
                "BaggageException",
                saved.getId().toString(),
                "Resolved with notes: " + resolutionNotes,
                "internal"
        ));

        return toDto(saved);
    }

    private ExceptionDto toDto(BaggageException ex) {
        ExceptionDto dto = new ExceptionDto();
        dto.setId(ex.getId());
        dto.setBaggageTag(ex.getBaggageTag());
        dto.setExceptionType(ex.getExceptionType());
        dto.setSeverity(ex.getSeverity());
        dto.setDescription(ex.getDescription());
        if (ex.getHandlingPoint() != null) {
            dto.setHandlingPointId(ex.getHandlingPoint().getId());
            dto.setHandlingPointName(ex.getHandlingPoint().getName());
        }
        dto.setStatus(ex.getStatus());
        dto.setReportedAt(ex.getReportedAt());
        dto.setResolvedAt(ex.getResolvedAt());
        dto.setResolvedBy(ex.getResolvedBy());
        dto.setResolutionNotes(ex.getResolutionNotes());
        return dto;
    }
}
