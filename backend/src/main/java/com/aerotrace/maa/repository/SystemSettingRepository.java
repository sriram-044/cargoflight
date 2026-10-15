package com.aerotrace.maa.repository;

import com.aerotrace.maa.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
    List<SystemSetting> findByCategoryOrderBySettingKeyAsc(String category);
}
