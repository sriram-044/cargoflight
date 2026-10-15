package com.aerotrace.maa;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class AerotraceApplication {

    private static final Logger log = LoggerFactory.getLogger(AerotraceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(AerotraceApplication.class, args);
    }

    @PostConstruct
    public void init() {
        // Enforce Asia/Kolkata timezone standard for MAA Airport operations
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        log.info("AEROTRACE MAA initialized with standard TimeZone: Asia/Kolkata (IST)");
    }
}
