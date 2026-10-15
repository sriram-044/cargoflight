package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.BaggageException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaggageExceptionRepository extends JpaRepository<BaggageException, Long> {
    List<BaggageException> findByBaggageTag(String baggageTag);
    List<BaggageException> findByStatus(String status);
    Page<BaggageException> findByStatus(String status, Pageable pageable);
    long countByStatus(String status);
}
