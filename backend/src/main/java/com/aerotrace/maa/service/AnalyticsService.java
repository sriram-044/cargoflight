package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.AnalyticsSummaryDto;
import com.aerotrace.maa.entity.Baggage;
import com.aerotrace.maa.repository.BaggageExceptionRepository;
import com.aerotrace.maa.repository.BaggageMovementHistoryRepository;
import com.aerotrace.maa.repository.BaggageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class AnalyticsService {

    private final BaggageRepository baggageRepository;
    private final BaggageExceptionRepository exceptionRepository;
    private final BaggageMovementHistoryRepository historyRepository;

    public AnalyticsService(BaggageRepository baggageRepository,
                            BaggageExceptionRepository exceptionRepository,
                            BaggageMovementHistoryRepository historyRepository) {
        this.baggageRepository = baggageRepository;
        this.exceptionRepository = exceptionRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getOperationalSummary() {
        AnalyticsSummaryDto dto = new AnalyticsSummaryDto();

        long totalBags = baggageRepository.count();
        dto.setTotalBaggageProcessed(totalBags);
        dto.setAwaitingSecurity(baggageRepository.countByCurrentStatus("CHECKED_IN"));
        dto.setInSorting(baggageRepository.countByCurrentStatus("SORTED") + baggageRepository.countByCurrentStatus("IN_TRANSIT"));
        dto.setReadyForLoading(baggageRepository.countByCurrentStatus("READY_FOR_LOADING"));
        dto.setLoaded(baggageRepository.countByCurrentStatus("LOADED"));
        dto.setAwaitingCollection(baggageRepository.countByCurrentStatus("DELIVERED_TO_BELT"));
        dto.setDelayedCount(baggageRepository.countByDelayedTrue());
        dto.setMisroutedCount(baggageRepository.countByMisroutedTrue());
        dto.setOpenExceptionsCount(exceptionRepository.countByStatus("OPEN"));

        double successRate = totalBags > 0
                ? Math.max(0.0, 100.0 - ((double) (dto.getDelayedCount() + dto.getMisroutedCount()) / totalBags * 100.0))
                : 100.0;
        dto.setOverallProcessingSuccessRate(Math.round(successRate * 10.0) / 10.0);

        // Stage breakdown
        List<Object[]> statusCounts = baggageRepository.countByStatusGroup();
        Map<String, Long> statusMap = new LinkedHashMap<>();
        List<AnalyticsSummaryDto.StageDistributionDto> stages = new ArrayList<>();
        for (Object[] row : statusCounts) {
            String status = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            statusMap.put(status, count);
            stages.add(new AnalyticsSummaryDto.StageDistributionDto(status, count));
        }
        dto.setStatusDistribution(statusMap);
        dto.setStageDistribution(stages);

        // Dynamic operational throughput calculated from real movement history events
        List<com.aerotrace.maa.entity.BaggageMovementHistory> history = historyRepository.findAll();
        Map<String, Long> hourlyCounts = new TreeMap<>();
        for (com.aerotrace.maa.entity.BaggageMovementHistory h : history) {
            if (h.getRecordedAt() != null) {
                String hr = String.format("%02d:00", h.getRecordedAt().getHour());
                hourlyCounts.put(hr, hourlyCounts.getOrDefault(hr, 0L) + 1);
            }
        }
        List<AnalyticsSummaryDto.HourlyThroughputDto> hourly = new ArrayList<>();
        hourlyCounts.forEach((hr, count) -> {
            hourly.add(new AnalyticsSummaryDto.HourlyThroughputDto(hr, count, count * 2));
        });
        dto.setHourlyThroughput(hourly);

        return dto;
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportBaggageCsv() {
        List<Baggage> baggageList = baggageRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Write CSV Header
            writer.println("BaggageTag,FlightNumber,PassengerName,PNR,Origin,Destination,WeightKg,CurrentStatus,HandlingPoint,LastScanTime,Delayed,Misrouted");

            for (Baggage b : baggageList) {
                String flight = b.getFlight() != null ? b.getFlight().getFlightNumber() : "N/A";
                String point = b.getCurrentHandlingPoint() != null ? b.getCurrentHandlingPoint().getId() : "N/A";
                String lastScan = b.getLastScanTime() != null ? b.getLastScanTime().toString() : "N/A";

                writer.printf("%s,%s,\"%s\",%s,%s,%s,%.2f,%s,%s,%s,%b,%b%n",
                        escapeCsv(b.getBaggageTag()),
                        escapeCsv(flight),
                        escapeCsv(b.getPassengerName()),
                        escapeCsv(b.getPassengerPnr()),
                        escapeCsv(b.getOriginIata()),
                        escapeCsv(b.getDestinationIata()),
                        b.getWeightKg(),
                        escapeCsv(b.getCurrentStatus()),
                        escapeCsv(point),
                        escapeCsv(lastScan),
                        b.isDelayed(),
                        b.isMisrouted()
                );
            }
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        String s = val.replace("\"", "\"\"");
        // Prevent CSV Formula Injection (=, +, -, @, tab, CR)
        if (s.startsWith("=") || s.startsWith("+") || s.startsWith("-") || s.startsWith("@") || s.startsWith("\t") || s.startsWith("\r")) {
            s = "'" + s;
        }
        return s;
    }
}
