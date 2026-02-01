package com.byteme.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrgOrderTest {

    @Test
    @DisplayName("Should initialize with default values safely")
    void testDefaults() {
        OrgOrder order = new OrgOrder();
        
        // Verifying code-level defaults without DB involvement
        assertEquals(1, order.getQuantity());
        assertEquals(OrgOrder.Status.RESERVED, order.getStatus());
        assertNotNull(order.getReservedAt());
    }

    @Test
    @DisplayName("Should handle relationship assignment without persistence")
    void testStateManagement() {
        // Arrange
        OrgOrder order = new OrgOrder();
        Organisation mockOrg = new Organisation(); 
        BundlePosting mockPosting = new BundlePosting();
        UUID orderId = UUID.randomUUID();

        // Act
        order.setOrderId(orderId);
        order.setOrganisation(mockOrg);
        order.setPosting(mockPosting);
        order.setQuantity(10);
        order.setTotalPriceCents(5000);
        order.setStatus(OrgOrder.Status.COLLECTED);

        // Assert
        assertEquals(orderId, order.getOrderId());
        assertEquals(mockOrg, order.getOrganisation());
        assertAll("Verify multiple fields",
            () -> assertEquals(10, order.getQuantity()),
            () -> assertEquals(5000, order.getTotalPriceCents()),
            () -> assertEquals(OrgOrder.Status.COLLECTED, order.getStatus())
        );
    }

    @Test
    @DisplayName("Should verify enum types correctly")
    void testEnumSafety() {
        OrgOrder order = new OrgOrder();
        
        // Testing that the enum logic works in memory
        order.setStatus(OrgOrder.Status.CANCELLED);
        assertEquals("CANCELLED", order.getStatus().name());
        
        order.setStatus(OrgOrder.Status.EXPIRED);
        assertEquals(OrgOrder.Status.EXPIRED, order.getStatus());
    }
}