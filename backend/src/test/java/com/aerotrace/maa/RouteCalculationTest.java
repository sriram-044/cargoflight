package com.aerotrace.maa;

import com.aerotrace.maa.dto.RouteCalculationRequest;
import com.aerotrace.maa.dto.RouteResponse;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.entity.HandlingPointConnection;
import com.aerotrace.maa.repository.HandlingPointConnectionRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import com.aerotrace.maa.service.RouteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RouteCalculationTest {

    @Mock
    private HandlingPointRepository handlingPointRepository;

    @Mock
    private HandlingPointConnectionRepository connectionRepository;

    @InjectMocks
    private RouteService routeService;

    @Test
    @DisplayName("Should calculate optimal Dijkstra shortest route on MAA handling topology")
    void testCalculateRouteDijkstra() {
        HandlingPoint checkin = new HandlingPoint();
        checkin.setId("MAA-CHECKIN-01");
        checkin.setName("Check-in Zone A");

        HandlingPoint security = new HandlingPoint();
        security.setId("MAA-SECURITY-01");
        security.setName("Security EDS");

        HandlingPoint sorting = new HandlingPoint();
        sorting.setId("MAA-SORTING-01");
        sorting.setName("Sorting Loop");

        HandlingPointConnection edge1 = new HandlingPointConnection();
        edge1.setFromPoint(checkin);
        edge1.setToPoint(security);
        edge1.setDistanceMeters(BigDecimal.valueOf(85.0));
        edge1.setEstimatedTraversalSeconds(65);
        edge1.setActive(true);

        HandlingPointConnection edge2 = new HandlingPointConnection();
        edge2.setFromPoint(security);
        edge2.setToPoint(sorting);
        edge2.setDistanceMeters(BigDecimal.valueOf(140.0));
        edge2.setEstimatedTraversalSeconds(110);
        edge2.setActive(true);

        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);
        when(handlingPointRepository.existsById("MAA-SORTING-01")).thenReturn(true);
        when(connectionRepository.findAll()).thenReturn(List.of(edge1, edge2));
        when(handlingPointRepository.findAllById(any())).thenReturn(List.of(checkin, security, sorting));
        when(connectionRepository.findByFromPointIdAndToPointId("MAA-CHECKIN-01", "MAA-SECURITY-01")).thenReturn(Optional.of(edge1));
        when(connectionRepository.findByFromPointIdAndToPointId("MAA-SECURITY-01", "MAA-SORTING-01")).thenReturn(Optional.of(edge2));

        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-SORTING-01");
        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertTrue(response.isRouteFound());
        assertEquals(225.0, response.getTotalDistanceMeters().doubleValue());
        assertEquals(175, response.getEstimatedTraversalSeconds());
        assertEquals("MAA_TOPOLOGY_SOLVER", response.getRoutingEngine());
    }

    @Test
    @DisplayName("Should detect when connection blockage prevents route traversal")
    void testBlockedConnectionFailsGracefully() {
        HandlingPoint checkin = new HandlingPoint();
        checkin.setId("MAA-CHECKIN-01");

        HandlingPoint security = new HandlingPoint();
        security.setId("MAA-SECURITY-01");

        HandlingPointConnection edge1 = new HandlingPointConnection();
        edge1.setFromPoint(checkin);
        edge1.setToPoint(security);
        edge1.setDistanceMeters(BigDecimal.valueOf(85.0));
        edge1.setEstimatedTraversalSeconds(65);
        edge1.setActive(true);

        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);
        when(handlingPointRepository.existsById("MAA-SECURITY-01")).thenReturn(true);
        when(connectionRepository.findAll()).thenReturn(List.of(edge1));

        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-SECURITY-01");
        req.setBlockedConnectionIds(List.of("MAA-CHECKIN-01->MAA-SECURITY-01"));

        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertFalse(response.isRouteFound());
        assertTrue(response.getMessage().contains("active connection blockages"));
    }
}
