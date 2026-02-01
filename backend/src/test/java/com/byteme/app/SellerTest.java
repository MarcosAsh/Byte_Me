package com.byteme.app;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SellerTest {

    @Test
    void testSellerGettersAndSetters() {
        // Arrange
        Seller seller = new Seller();
        UserAccount user = new UserAccount();
        UUID id = UUID.randomUUID();
        // We truncate to Millis here to avoid any tiny precision issues
        Instant fixedTime = Instant.now().truncatedTo(ChronoUnit.MILLIS);

        // Act
        seller.setSellerId(id);
        seller.setUser(user);
        seller.setName("The Exeter Bakery");
        seller.setLocationText("High Street");
        seller.setOpeningHoursText("9-5");
        seller.setContactStub("@bakery");
        seller.setCreatedAt(fixedTime);

        // Assert
        assertEquals(id, seller.getSellerId());
        assertEquals(user, seller.getUser());
        assertEquals("The Exeter Bakery", seller.getName());
        assertEquals("High Street", seller.getLocationText());
        assertEquals("9-5", seller.getOpeningHoursText());
        assertEquals("@bakery", seller.getContactStub());
        assertEquals(fixedTime, seller.getCreatedAt());
    }

    @Test
    void testAutoInitialization() {
        // Act
        Seller seller = new Seller();

        // Assert
        // This confirms that 'createdAt = Instant.now()' in your entity works
        assertNotNull(seller.getCreatedAt());
        // Verify it's a realistic time (not in the future)
        assertTrue(seller.getCreatedAt().isBefore(Instant.now().plusSeconds(1)));
    }

    @Test
    void testUserRelationship() {
        // Arrange
        Seller seller = new Seller();
        UserAccount user = new UserAccount();
        user.setEmail("test@byteme.com");

        // Act
        seller.setUser(user);

        // Assert
        assertNotNull(seller.getUser());
        assertEquals("test@byteme.com", seller.getUser().getEmail());
    }
}