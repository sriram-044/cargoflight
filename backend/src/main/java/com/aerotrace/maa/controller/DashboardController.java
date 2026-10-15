package com.aerotrace.maa.controller;

import com.aerotrace.maa.dto.AnalyticsSummaryDto;
import com.aerotrace.maa.dto.ApiResponse;
import com.aerotrace.maa.dto.DatabaseHealthDto;
import com.aerotrace.maa.entity.BaggageMovementHistory;
import com.aerotrace.maa.repository.BaggageMovementHistoryRepository;
import com.aerotrace.maa.service.AnalyticsService;
import com.aerotrace.maa.service.DatabaseHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final AnalyticsService analyticsService;
    private final DatabaseHealthService databaseHealthService;
    private final BaggageMovementHistoryRepository historyRepository;

    public DashboardController(AnalyticsService analyticsService,
                               DatabaseHealthService databaseHealthService,
                               BaggageMovementHistoryRepository historyRepository) {
        this.analyticsService = analyticsService;
        this.databaseHealthService = databaseHealthService;
        this.historyRepository = historyRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary() {
        AnalyticsSummaryDto analytics = analyticsService.getOperationalSummary();
        DatabaseHealthDto dbHealth = databaseHealthService.checkAllDatabases();
        List<BaggageMovementHistory> recentActivity = historyRepository.findTop20ByOrderByRecordedAtDesc();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("operationalMetrics", analytics);
        dashboard.put("databaseHealth", dbHealth);
        dashboard.put("recentActivity", recentActivity);

        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
