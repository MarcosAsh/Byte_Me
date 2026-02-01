package com.byteme.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserAccountTest {

    @Test
    @DisplayName("Test UserAccount Getters and Setters")
    void testUserAccountFields() {
        // Arrange
        UserAccount user = new UserAccount();
        UUID id = UUID.randomUUID();
        String email = "dev@byteme.com";
        String hash = "hashed_pw_123";
        UserAccount.Role role = UserAccount.Role.ORG_ADMIN;
        Instant fixedTime = Instant.now().truncatedTo(ChronoUnit.MILLIS);

        // Act
        user.setUserId(id);
        user.setEmail(email);
        user.setPasswordHash(hash);
        user.setRole(role);
        user.setCreatedAt(fixedTime);

        // Assert
        assertAll("UserAccount State",
            () -> assertEquals(id, user.getUserId()),
            () -> assertEquals(email, user.getEmail()),
            () -> assertEquals(hash, user.getPasswordHash()),
            () -> assertEquals(role, user.getRole()),
            () -> assertEquals(fixedTime, user.getCreatedAt())
        );
    }

    @Test
    @DisplayName("Test Default Values and Enums")
    void testDefaultsAndEnums() {
        // Act
        UserAccount user = new UserAccount();
        
        // Assert defaults
        assertNotNull(user.getCreatedAt(), "createdAt should be auto-initialized");
        
        // Test Role Enum
        user.setRole(UserAccount.Role.SELLER);
        assertEquals(UserAccount.Role.SELLER, user.getRole());
        assertEquals("SELLER", user.getRole().name());
    }

    @Test
    @DisplayName("Test Time Initialization Logic")
    void testTimeInitialization() {
        // Act
        Instant before = Instant.now().minusMillis(1);
        UserAccount user = new UserAccount();
        Instant after = Instant.now().plusMillis(1);

        // Assert: createdAt should be between the timestamps recorded during test execution
        assertTrue(user.getCreatedAt().isAfter(before) || user.getCreatedAt().equals(before), 
            "createdAt should not be in the past");
        assertTrue(user.getCreatedAt().isBefore(after) || user.getCreatedAt().equals(after), 
            "createdAt should not be in the future");
    }
}