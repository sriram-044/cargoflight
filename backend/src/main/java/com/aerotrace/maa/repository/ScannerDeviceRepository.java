package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.ScannerDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScannerDeviceRepository extends JpaRepository<ScannerDevice, String> {
    List<ScannerDevice> findByHandlingPointId(String handlingPointId);
    List<ScannerDevice> findByStatus(String status);
    long countByStatus(String status);
}
