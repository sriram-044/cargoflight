package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.ScanResultResponse;
import com.aerotrace.maa.dto.ScannerEventRequest;
import com.aerotrace.maa.entity.BaggageMovementHistory;
import com.aerotrace.maa.repository.BaggageMovementHistoryRepository;
import com.aerotrace.maa.security.UserPrincipal;
import com.aerotrace.maa.service.ScanProcessingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scans")
public class ScanController {

    private final ScanProcessingService scanProcessingService;
    private final BaggageMovementHistoryRepository historyRepository;

    public ScanController(ScanProcessingService scanProcessingService,
                          BaggageMovementHistoryRepository historyRepository) {
        this.scanProcessingService = scanProcessingService;
        this.historyRepository = historyRepository;
    }

    @PostMapping("/submit")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'BAGGAGE_HANDLER', 'SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<ScanResultResponse>> submitScan(
            @Valid @RequestBody ScannerEventRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "system";
        ScanResultResponse response = scanProcessingService.processScanEvent(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Scanner event processed", response));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<BaggageMovementHistory>>> getRecentScans() {
        List<BaggageMovementHistory> scans = historyRepository.findTop20ByOrderByRecordedAtDesc();
        return ResponseEntity.ok(ApiResponse.ok(scans));
    }
}
