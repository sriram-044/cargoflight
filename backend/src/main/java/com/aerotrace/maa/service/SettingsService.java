package com.aerotrace.maa.service;

import com.aerotrace.maa.entity.SystemSetting;
import com.aerotrace.maa.exception.ResourceNotFoundException;
import com.aerotrace.maa.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class SettingsService {

    private final SystemSettingRepository settingRepository;

    public SettingsService(SystemSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemSetting> getAllSettings() {
        return settingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<String, String> getSettingsAsMap() {
        Map<String, String> map = new LinkedHashMap<>();
        for (SystemSetting s : settingRepository.findAll()) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return settingRepository.findById(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional
    public SystemSetting updateSetting(String key, String value, String username) {
        SystemSetting setting = settingRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with key: " + key));

        setting.setSettingValue(value);
        setting.setUpdatedAt(OffsetDateTime.now());
        setting.setUpdatedBy(username != null ? username : "SYSTEM");

        return settingRepository.save(setting);
    }

    @Transactional
    public Map<String, String> updateSettingsBatch(Map<String, String> updates, String username) {
        Map<String, String> resultMap = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            Optional<SystemSetting> opt = settingRepository.findById(entry.getKey());
            if (opt.isPresent()) {
                SystemSetting s = opt.get();
                s.setSettingValue(entry.getValue());
                s.setUpdatedAt(OffsetDateTime.now());
                s.setUpdatedBy(username != null ? username : "SYSTEM");
                settingRepository.save(s);
                resultMap.put(s.getSettingKey(), s.getSettingValue());
            }
        }
        return resultMap;
    }
}
