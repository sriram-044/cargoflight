package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.Baggage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BaggageRepository extends JpaRepository<Baggage, Long> {

    Optional<Baggage> findByBaggageTag(String baggageTag);

    boolean existsByBaggageTag(String baggageTag);

    List<Baggage> findByFlightId(Long flightId);

    List<Baggage> findByPassengerPnr(String pnr);

    Page<Baggage> findByCurrentStatus(String status, Pageable pageable);

    @Query("SELECT b FROM Baggage b WHERE " +
           "(CAST(:query AS string) IS NULL OR " +
           " LOWER(b.baggageTag) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " LOWER(b.passengerName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR " +
           " LOWER(b.passengerPnr) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR b.currentStatus = CAST(:status AS string)) AND " +
           "(:flightId IS NULL OR b.flight.id = :flightId)")
    Page<Baggage> searchBaggage(@Param("query") String query,
                                @Param("status") String status,
                                @Param("flightId") Long flightId,
                                Pageable pageable);

    long countByCurrentStatus(String status);

    long countByDelayedTrue();

    long countByMisroutedTrue();

    @Query("SELECT b.currentStatus, COUNT(b) FROM Baggage b GROUP BY b.currentStatus")
    List<Object[]> countByStatusGroup();
}
