package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AirportRepository extends JpaRepository<Airport, String> {
    Optional<Airport> findByCodeAndActiveTrue(String code);
}
