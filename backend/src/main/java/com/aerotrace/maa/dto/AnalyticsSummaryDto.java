package com.aerotrace.maa.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsSummaryDto {
    private long totalBaggageProcessed;
    private long awaitingSecurity;
    private long inSorting;
    private long readyForLoading;
    private long loaded;
    private long awaitingCollection;
    private long delayedCount;
    private long misroutedCount;
    private long openExceptionsCount;
    private double overallProcessingSuccessRate;
    private Map<String, Long> statusDistribution;
    private List<HourlyThroughputDto> hourlyThroughput;
    private List<StageDistributionDto> stageDistribution;

    public static class HourlyThroughputDto {
        private String hour;
        private long bagsProcessed;
        private long scansRecorded;

        public HourlyThroughputDto() {}
        public HourlyThroughputDto(String hour, long bagsProcessed, long scansRecorded) {
            this.hour = hour;
            this.bagsProcessed = bagsProcessed;
            this.scansRecorded = scansRecorded;
        }

        public String getHour() { return hour; }
        public void setHour(String hour) { this.hour = hour; }
        public long getBagsProcessed() { return bagsProcessed; }
        public void setBagsProcessed(long bagsProcessed) { this.bagsProcessed = bagsProcessed; }
        public long getScansRecorded() { return scansRecorded; }
        public void setScansRecorded(long scansRecorded) { this.scansRecorded = scansRecorded; }
    }

    public static class StageDistributionDto {
        private String stage;
        private long count;

        public StageDistributionDto() {}
        public StageDistributionDto(String stage, long count) {
            this.stage = stage;
            this.count = count;
        }

        public String getStage() { return stage; }
        public void setStage(String stage) { this.stage = stage; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public AnalyticsSummaryDto() {}

    // Getters and Setters
    public long getTotalBaggageProcessed() { return totalBaggageProcessed; }
    public void setTotalBaggageProcessed(long totalBaggageProcessed) { this.totalBaggageProcessed = totalBaggageProcessed; }

    public long getAwaitingSecurity() { return awaitingSecurity; }
    public void setAwaitingSecurity(long awaitingSecurity) { this.awaitingSecurity = awaitingSecurity; }

    public long getInSorting() { return inSorting; }
    public void setInSorting(long inSorting) { this.inSorting = inSorting; }

    public long getReadyForLoading() { return readyForLoading; }
    public void setReadyForLoading(long readyForLoading) { this.readyForLoading = readyForLoading; }

    public long getLoaded() { return loaded; }
    public void setLoaded(long loaded) { this.loaded = loaded; }

    public long getAwaitingCollection() { return awaitingCollection; }
    public void setAwaitingCollection(long awaitingCollection) { this.awaitingCollection = awaitingCollection; }

    public long getDelayedCount() { return delayedCount; }
    public void setDelayedCount(long delayedCount) { this.delayedCount = delayedCount; }

    public long getMisroutedCount() { return misroutedCount; }
    public void setMisroutedCount(long misroutedCount) { this.misroutedCount = misroutedCount; }

    public long getOpenExceptionsCount() { return openExceptionsCount; }
    public void setOpenExceptionsCount(long openExceptionsCount) { this.openExceptionsCount = openExceptionsCount; }

    public double getOverallProcessingSuccessRate() { return overallProcessingSuccessRate; }
    public void setOverallProcessingSuccessRate(double overallProcessingSuccessRate) { this.overallProcessingSuccessRate = overallProcessingSuccessRate; }

    public Map<String, Long> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(Map<String, Long> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<HourlyThroughputDto> getHourlyThroughput() { return hourlyThroughput; }
    public void setHourlyThroughput(List<HourlyThroughputDto> hourlyThroughput) { this.hourlyThroughput = hourlyThroughput; }

    public List<StageDistributionDto> getStageDistribution() { return stageDistribution; }
    public void setStageDistribution(List<StageDistributionDto> stageDistribution) { this.stageDistribution = stageDistribution; }
}
