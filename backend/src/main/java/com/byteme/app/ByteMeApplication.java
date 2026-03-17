package com.byteme.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ByteMeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ByteMeApplication.class, args);
    }
}
