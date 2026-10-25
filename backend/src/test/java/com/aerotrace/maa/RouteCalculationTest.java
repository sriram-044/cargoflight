package com.aerotrace.maa;

import com.aerotrace.maa.dto.HandlingPointDto;
import com.aerotrace.maa.dto.RouteCalculationRequest;
import com.aerotrace.maa.dto.RouteResponse;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.entity.HandlingPointConnection;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.HandlingPointConnectionRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import com.aerotrace.maa.service.RouteService;
import org.junit.jupiter.api.BeforeEach;
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

    private HandlingPoint checkin;
    private HandlingPoint security1;
    private HandlingPoint security2;
    private HandlingPoint sorting1;
    private HandlingPoint conveyor1;
    private HandlingPoint loading1;

    private HandlingPointConnection edge1;
    private HandlingPointConnection edge2;
    private HandlingPointConnection edgeSecurity2;
    private HandlingPointConnection edgeSec2Sort;

    @BeforeEach
    void setUp() {
        checkin = new HandlingPoint();
        checkin.setId("MAA-CHECKIN-01");
        checkin.setName("Check-in Zone A");
        checkin.setCategory("CHECK_IN");
        checkin.setOperationalStatus("ACTIVE");
        checkin.setCapacityPerHour(1200);

        security1 = new HandlingPoint();
        security1.setId("MAA-SECURITY-01");
        security1.setName("Security EDS");
        security1.setCategory("SECURITY");
        security1.setOperationalStatus("ACTIVE");
        security1.setCapacityPerHour(1500);

        security2 = new HandlingPoint();
        security2.setId("MAA-SECURITY-02");
        security2.setName("Security CTX 2");
        security2.setCategory("SECURITY");
        security2.setOperationalStatus("ACTIVE");
        security2.setCapacityPerHour(450);

        sorting1 = new HandlingPoint();
        sorting1.setId("MAA-SORTING-01");
        sorting1.setName("Sorting Loop");
        sorting1.setCategory("SORTING");
        sorting1.setOperationalStatus("ACTIVE");
        sorting1.setCapacityPerHour(3000);

        edge1 = new HandlingPointConnection();
        edge1.setFromPoint(checkin);
        edge1.setToPoint(security1);
        edge1.setDistanceMeters(BigDecimal.valueOf(85.0));
        edge1.setEstimatedTraversalSeconds(65);
        edge1.setActive(true);

        edge2 = new HandlingPointConnection();
        edge2.setFromPoint(security1);
        edge2.setToPoint(sorting1);
        edge2.setDistanceMeters(BigDecimal.valueOf(140.0));
        edge2.setEstimatedTraversalSeconds(110);
        edge2.setActive(true);

        edgeSecurity2 = new HandlingPointConnection();
        edgeSecurity2.setFromPoint(security1);
        edgeSecurity2.setToPoint(security2);
        edgeSecurity2.setDistanceMeters(BigDecimal.valueOf(40.0));
        edgeSecurity2.setEstimatedTraversalSeconds(35);
        edgeSecurity2.setActive(true);

        edgeSec2Sort = new HandlingPointConnection();
        edgeSec2Sort.setFromPoint(security2);
        edgeSec2Sort.setToPoint(sorting1);
        edgeSec2Sort.setDistanceMeters(BigDecimal.valueOf(110.0));
        edgeSec2Sort.setEstimatedTraversalSeconds(85);
        edgeSec2Sort.setActive(true);
    }

    @Test
    @DisplayName("Should calculate optimal shortest route on MAA handling topology")
    void testCalculateRouteDijkstra() {
        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);
        when(handlingPointRepository.existsById("MAA-SORTING-01")).thenReturn(true);
        when(handlingPointRepository.findAll()).thenReturn(List.of(checkin, security1, sorting1));
        when(connectionRepository.findAll()).thenReturn(List.of(edge1, edge2));
        when(handlingPointRepository.findAllById(any())).thenReturn(List.of(checkin, security1, sorting1));
        when(connectionRepository.findByFromPointIdAndToPointId("MAA-CHECKIN-01", "MAA-SECURITY-01")).thenReturn(Optional.of(edge1));
        when(connectionRepository.findByFromPointIdAndToPointId("MAA-SECURITY-01", "MAA-SORTING-01")).thenReturn(Optional.of(edge2));

        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-SORTING-01", "DISTANCE");
        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertTrue(response.isRouteFound());
        assertEquals(225.0, response.getTotalDistanceMeters().doubleValue());
        assertEquals(175, response.getEstimatedTraversalSeconds());
        assertEquals("MAA_TOPOLOGY_SOLVER", response.getRoutingEngine());
        assertNotNull(response.getExplanation());
        assertTrue(response.getExplanation().contains("225.0 meters"));
    }

    @Test
    @DisplayName("Should detect when connection blockage prevents route traversal")
    void testBlockedConnectionFailsGracefully() {
        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);
        when(handlingPointRepository.existsById("MAA-SECURITY-01")).thenReturn(true);
        when(handlingPointRepository.findAll()).thenReturn(List.of(checkin, security1));
        when(connectionRepository.findAll()).thenReturn(List.of(edge1));
        when(handlingPointRepository.findAllById(any())).thenReturn(List.of(checkin, security1));

        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-SECURITY-01");
        req.setBlockedConnectionIds(List.of("MAA-CHECKIN-01->MAA-SECURITY-01"));

        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertFalse(response.isRouteFound());
        assertTrue(response.getMessage().contains("conveyor stoppages"));
    }

    @Test
    @DisplayName("Should validate that origin and destination must be different")
    void testIdenticalOriginAndDestinationFailsValidation() {
        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);

        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-CHECKIN-01");
        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertFalse(response.isRouteFound());
        assertTrue(response.getMessage().contains("must be different"));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when origin point does not exist")
    void testUnknownOriginThrowsException() {
        when(handlingPointRepository.existsById("UNKNOWN-POINT")).thenReturn(false);

        RouteCalculationRequest req = new RouteCalculationRequest("UNKNOWN-POINT", "MAA-CHECKIN-01");
        assertThrows(ResourceNotFoundException.class, () -> routeService.calculateRoute(req));
    }

    @Test
    @DisplayName("Should find alternative route when primary path is blocked")
    void testReroutingAroundBlockedConveyor() {
        // Two paths to sorting1:
        // Path 1: checkin -> security1 -> sorting1 (85 + 140 = 225m, 65 + 110 = 175s)
        // Path 2: checkin -> security1 -> security2 -> sorting1 (85 + 40 + 110 = 235m, 65 + 35 + 85 = 185s)
        when(handlingPointRepository.existsById("MAA-CHECKIN-01")).thenReturn(true);
        when(handlingPointRepository.existsById("MAA-SORTING-01")).thenReturn(true);
        when(handlingPointRepository.findAll()).thenReturn(List.of(checkin, security1, security2, sorting1));
        when(connectionRepository.findAll()).thenReturn(List.of(edge1, edge2, edgeSecurity2, edgeSec2Sort));
        when(handlingPointRepository.findAllById(any())).thenReturn(List.of(checkin, security1, security2, sorting1));
        when(connectionRepository.findByFromPointIdAndToPointId(anyString(), anyString())).thenAnswer(invocation -> {
            String from = invocation.getArgument(0);
            String to = invocation.getArgument(1);
            if ("MAA-CHECKIN-01".equals(from) && "MAA-SECURITY-01".equals(to)) return Optional.of(edge1);
            if ("MAA-SECURITY-01".equals(from) && "MAA-SORTING-01".equals(to)) return Optional.of(edge2);
            if ("MAA-SECURITY-01".equals(from) && "MAA-SECURITY-02".equals(to)) return Optional.of(edgeSecurity2);
            if ("MAA-SECURITY-02".equals(from) && "MAA-SORTING-01".equals(to)) return Optional.of(edgeSec2Sort);
            return Optional.empty();
        });

        // Block primary edge2: MAA-SECURITY-01 -> MAA-SORTING-01
        RouteCalculationRequest req = new RouteCalculationRequest("MAA-CHECKIN-01", "MAA-SORTING-01", "DISTANCE");
        req.setBlockedConnectionIds(List.of("MAA-SECURITY-01->MAA-SORTING-01"));

        RouteResponse response = routeService.calculateRoute(req);

        assertNotNull(response);
        assertTrue(response.isRouteFound());
        assertTrue(response.isReroutedDueToBlockage());
        assertEquals(235.0, response.getTotalDistanceMeters().doubleValue());
        assertEquals(185, response.getEstimatedTraversalSeconds());
        assertTrue(response.getExplanation().contains("simulated belt stoppage"));
    }

    @Test
    @DisplayName("Should retrieve conveyor segment details with speed and status")
    void testGetSegmentDetails() {
        when(connectionRepository.findByFromPointIdAndToPointId("MAA-CHECKIN-01", "MAA-SECURITY-01"))
                .thenReturn(Optional.of(edge1));

        RouteResponse.RouteEdgeDto segment = routeService.getSegmentDetails("MAA-CHECKIN-01", "MAA-SECURITY-01");

        assertNotNull(segment);
        assertEquals("MAA-CHECKIN-01", segment.getFromId());
        assertEquals("MAA-SECURITY-01", segment.getToId());
        assertEquals(85.0, segment.getDistanceMeters().doubleValue());
        assertEquals(65, segment.getEstimatedSeconds());
        assertEquals(1.31, segment.getSpeedMetersPerSecond()); // 85 / 65 = 1.307 -> 1.31
        assertEquals("HEALTHY", segment.getStatus());
    }
}
