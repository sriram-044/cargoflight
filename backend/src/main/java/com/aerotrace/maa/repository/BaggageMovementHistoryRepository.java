package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.BaggageMovementHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaggageMovementHistoryRepository extends JpaRepository<BaggageMovementHistory, Long> {
    List<BaggageMovementHistory> findByBaggageTagOrderByRecordedAtAsc(String baggageTag);
    List<BaggageMovementHistory> findByBaggageIdOrderByRecordedAtAsc(Long baggageId);
    List<BaggageMovementHistory> findTop20ByOrderByRecordedAtDesc();
}
