package com.aerotrace.maa.service;

import com.aerotrace.maa.dto.HandlingPointDto;
import com.aerotrace.maa.entity.HandlingPoint;
import com.aerotrace.maa.entity.HandlingPointConnection;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.HandlingPointConnectionRepository;
import com.aerotrace.maa.repository.HandlingPointRepository;
import com.aerotrace.maa.repository.ScannerDeviceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HandlingPointService {

    private final HandlingPointRepository handlingPointRepository;
    private final HandlingPointConnectionRepository connectionRepository;
    private final ScannerDeviceRepository scannerDeviceRepository;

    public HandlingPointService(HandlingPointRepository handlingPointRepository,
                                HandlingPointConnectionRepository connectionRepository,
                                ScannerDeviceRepository scannerDeviceRepository) {
        this.handlingPointRepository = handlingPointRepository;
        this.connectionRepository = connectionRepository;
        this.scannerDeviceRepository = scannerDeviceRepository;
    }

    @Transactional(readOnly = true)
    public List<HandlingPointDto> getAllHandlingPoints() {
        List<HandlingPoint> points = handlingPointRepository.findByAirportCodeOrderByIdAsc("MAA");
        List<HandlingPointConnection> allConnections = connectionRepository.findAll();

        return points.stream().map(p -> {
            HandlingPointDto dto = new HandlingPointDto(p.getId(), p.getName(), p.getCategory(), p.getZone(), p.getOperationalStatus(), p.getCapacityPerHour());
            List<String> connectedTo = allConnections.stream()
                    .filter(c -> c.getFromPoint().getId().equals(p.getId()) && c.isActive())
                    .map(c -> c.getToPoint().getId())
                    .collect(Collectors.toList());
            dto.setConnectedToIds(connectedTo);
            dto.setActiveScannerCount((int) scannerDeviceRepository.findByHandlingPointId(p.getId()).stream().filter(s -> "ONLINE".equals(s.getStatus())).count());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public HandlingPointDto updateStatus(String pointId, String newStatus) {
        HandlingPoint point = handlingPointRepository.findById(pointId)
                .orElseThrow(() -> new ResourceNotFoundException("Handling point not found: " + pointId));
        point.setOperationalStatus(newStatus);
        handlingPointRepository.save(point);

        HandlingPointDto dto = new HandlingPointDto(point.getId(), point.getName(), point.getCategory(), point.getZone(), point.getOperationalStatus(), point.getCapacityPerHour());
        return dto;
    }
}
