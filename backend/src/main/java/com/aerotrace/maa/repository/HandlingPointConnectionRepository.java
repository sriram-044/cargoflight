package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.HandlingPointConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HandlingPointConnectionRepository extends JpaRepository<HandlingPointConnection, Long> {
    List<HandlingPointConnection> findByActiveTrue();
    List<HandlingPointConnection> findByFromPointId(String fromPointId);
    Optional<HandlingPointConnection> findByFromPointIdAndToPointId(String fromPointId, String toPointId);
}
