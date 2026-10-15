package com.aerotrace.maa.integration.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MongoTelemetryRepository extends MongoRepository<RawScannerEventDocument, String> {
    Optional<RawScannerEventDocument> findByIdempotencyKey(String idempotencyKey);
    List<RawScannerEventDocument> findByBaggageTagOrderByTimestampDesc(String baggageTag);
    List<RawScannerEventDocument> findTop20ByOrderByTimestampDesc();
    long countByProcessingOutcome(String outcome);
}
