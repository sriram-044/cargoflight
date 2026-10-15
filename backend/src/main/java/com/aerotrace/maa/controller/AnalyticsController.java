package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.AnalyticsSummaryDto;
import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.service.AnalyticsService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getAnalyticsSummary() {
        AnalyticsSummaryDto summary = analyticsService.getOperationalSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<InputStreamResource> exportBaggageCsv() {
        ByteArrayInputStream csvStream = analyticsService.exportBaggageCsv();
        String filename = "aerotrace_maa_baggage_report.csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(new InputStreamResource(csvStream));
    }
}
