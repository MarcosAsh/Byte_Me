package com.byteme.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ReservationTest {

    @Test
    @DisplayName("Should initialize with default values safely")
    void testDefaults() {
        Reservation reservation = new Reservation();

        assertEquals(Reservation.Status.RESERVED, reservation.getStatus());
        assertNotNull(reservation.getReservedAt());
    }

    @Test
    @DisplayName("Should handle relationship assignment without persistence")
    void testStateManagement() {
        Reservation reservation = new Reservation();
        Organisation mockOrg = new Organisation();
        BundlePosting mockPosting = new BundlePosting();
        UUID reservationId = UUID.randomUUID();

        reservation.setReservationId(reservationId);
        reservation.setOrganisation(mockOrg);
        reservation.setPosting(mockPosting);
        reservation.setClaimCodeHash("hashedcode");
        reservation.setClaimCodeLast4("1234");
        reservation.setStatus(Reservation.Status.COLLECTED);

        assertEquals(reservationId, reservation.getReservationId());
        assertEquals(mockOrg, reservation.getOrganisation());
        assertAll("Verify multiple fields",
            () -> assertEquals("hashedcode", reservation.getClaimCodeHash()),
            () -> assertEquals("1234", reservation.getClaimCodeLast4()),
            () -> assertEquals(Reservation.Status.COLLECTED, reservation.getStatus())
        );
    }

    @Test
    @DisplayName("Should verify enum types correctly")
    void testEnumSafety() {
        Reservation reservation = new Reservation();

        reservation.setStatus(Reservation.Status.CANCELLED);
        assertEquals("CANCELLED", reservation.getStatus().name());

        reservation.setStatus(Reservation.Status.EXPIRED);
        assertEquals(Reservation.Status.EXPIRED, reservation.getStatus());

        reservation.setStatus(Reservation.Status.NO_SHOW);
        assertEquals(Reservation.Status.NO_SHOW, reservation.getStatus());
    }
}
