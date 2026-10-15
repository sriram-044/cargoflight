package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    Optional<Flight> findByFlightNumber(String flightNumber);

    List<Flight> findByOriginIataOrDestinationIataOrderByScheduledDepartureAsc(String origin, String dest);

    @Query("SELECT f FROM Flight f WHERE f.originIata = 'MAA' OR f.destinationIata = 'MAA' ORDER BY f.scheduledDeparture ASC")
    List<Flight> findAllMaaFlights();
}
