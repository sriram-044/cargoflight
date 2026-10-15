package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.HandlingPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HandlingPointRepository extends JpaRepository<HandlingPoint, String> {
    List<HandlingPoint> findByAirportCodeOrderByIdAsc(String airportCode);
    List<HandlingPoint> findByCategory(String category);
    List<HandlingPoint> findByOperationalStatus(String status);
}
