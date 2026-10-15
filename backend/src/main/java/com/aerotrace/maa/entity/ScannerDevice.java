package com.aerotrace.maa.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "scanner_devices")
public class ScannerDevice {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id; // SCN-MAA-CK01

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "handling_point_id", nullable = false)
    private HandlingPoint handlingPoint;

    @Column(name = "device_type", length = 32, nullable = false)
    private String deviceType; // FIXED_BARCODE, FIXED_RFID, MOBILE_TERMINAL

    @Column(name = "model", length = 64, nullable = false)
    private String model;

    @Column(name = "serial_number", length = 64, nullable = false)
    private String serialNumber;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "status", length = 16, nullable = false)
    private String status = "ONLINE"; // ONLINE, DEGRADED, OFFLINE

    @Column(name = "last_heartbeat", nullable = false)
    private OffsetDateTime lastHeartbeat = OffsetDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public ScannerDevice() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public HandlingPoint getHandlingPoint() { return handlingPoint; }
    public void setHandlingPoint(HandlingPoint handlingPoint) { this.handlingPoint = handlingPoint; }

    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(OffsetDateTime lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
