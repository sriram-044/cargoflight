package com.aerotrace.maa;

import com.aerotrace.maa.dto.BaggageRegistrationRequest;
import com.aerotrace.maa.dto.BaggageResponse;
import com.aerotrace.maa.entity.Baggage;
import com.aerotrace.maa.entity.Flight;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.exception.DuplicateTagException;
import com.aerotrace.maa.exception.InvalidStateTransitionException;
import com.aerotrace.maa.repository.*;
import com.aerotrace.maa.service.BaggageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BaggageServiceTest {

    @Mock
    private BaggageRepository baggageRepository;

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private HandlingPointRepository handlingPointRepository;

    @Mock
    private BaggageMovementHistoryRepository historyRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private BaggageService baggageService;

    private Flight testFlight;
    private HandlingPoint testPoint;

    @BeforeEach
    void setUp() {
        testFlight = new Flight();
        testFlight.setId(1L);
        testFlight.setFlightNumber("6E-2041");
        testFlight.setOriginIata("MAA");
        testFlight.setDestinationIata("DEL");

        testPoint = new HandlingPoint();
        testPoint.setId("MAA-CHECKIN-01");
        testPoint.setName("Check-in Desks Zone A");
    }

    @Test
    @DisplayName("Should successfully register baggage and persist initial movement history")
    void testRegisterBaggageSuccess() {
        BaggageRegistrationRequest request = new BaggageRegistrationRequest();
        request.setBaggageTag("MAATEST991");
        request.setFlightId(1L);
        request.setPassengerName("Ramanujan Iyengar");
        request.setPassengerPnr("PNR771");
        request.setOriginIata("MAA");
        request.setDestinationIata("DEL");
        request.setWeightKg(BigDecimal.valueOf(19.5));
        request.setInitialHandlingPointId("MAA-CHECKIN-01");

        when(baggageRepository.existsByBaggageTag("MAATEST991")).thenReturn(false);
        when(flightRepository.findById(1L)).thenReturn(Optional.of(testFlight));
        when(handlingPointRepository.findById("MAA-CHECKIN-01")).thenReturn(Optional.of(testPoint));

        when(baggageRepository.save(any(Baggage.class))).thenAnswer(invocation -> {
            Baggage b = invocation.getArgument(0);
            b.setId(100L);
            return b;
        });

        BaggageResponse response = baggageService.registerBaggage(request, "tester");

        assertNotNull(response);
        assertEquals("MAATEST991", response.getBaggageTag());
        assertEquals("REGISTERED", response.getCurrentStatus());
        verify(historyRepository, times(1)).save(any());
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should reject duplicate baggage tag with DuplicateTagException")
    void testRegisterDuplicateBaggageTag() {
        BaggageRegistrationRequest request = new BaggageRegistrationRequest();
        request.setBaggageTag("MAA6E008912");

        when(baggageRepository.existsByBaggageTag("MAA6E008912")).thenReturn(true);

        assertThrows(DuplicateTagException.class, () -> {
            baggageService.registerBaggage(request, "tester");
        });
    }

    @Test
    @DisplayName("Should reject illegal state transitions")
    void testInvalidStateTransitions() {
        // Direct jump from REGISTERED to LOADED is prohibited
        assertThrows(InvalidStateTransitionException.class, () -> {
            baggageService.validateTransition("REGISTERED", "LOADED");
        });

        // Valid transition from REGISTERED to CHECKED_IN
        assertDoesNotThrow(() -> {
            baggageService.validateTransition("REGISTERED", "CHECKED_IN");
        });
    }
}
