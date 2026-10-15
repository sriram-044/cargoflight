package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.ExceptionDto;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.ExceptionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/exceptions")
public class ExceptionController {

    private final ExceptionService exceptionService;

    public ExceptionController(ExceptionService exceptionService) {
        this.exceptionService = exceptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExceptionDto>>> getExceptions(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Page<ExceptionDto> result = exceptionService.getExceptionsByStatus(status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "reportedAt")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'SECURITY_OFFICER', 'BAGGAGE_HANDLER')")
    public ResponseEntity<ApiResponse<ExceptionDto>> createException(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "system";
        String tag = payload.get("baggageTag");
        String type = payload.get("exceptionType");
        String severity = payload.getOrDefault("severity", "MEDIUM");
        String description = payload.get("description");
        String pointId = payload.getOrDefault("handlingPointId", "MAA-CHECKIN-01");

        ExceptionDto created = exceptionService.createException(tag, type, severity, description, pointId, username);
        return ResponseEntity.ok(ApiResponse.ok("Exception logged successfully", created));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<ExceptionDto>> resolveException(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "system";
        String notes = payload.getOrDefault("resolutionNotes", "Resolved by operational supervisor.");
        ExceptionDto resolved = exceptionService.resolveException(id, notes, username);
        return ResponseEntity.ok(ApiResponse.ok("Exception marked as resolved", resolved));
    }
}
