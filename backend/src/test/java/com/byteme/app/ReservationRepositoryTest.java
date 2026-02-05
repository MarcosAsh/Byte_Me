package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class ReservationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ReservationRepository reservationRepo;

    private Organisation sharedOrg;
    private BundlePosting sharedPosting;

    @BeforeEach
    void setUp() {
        UserAccount sellerUser = new UserAccount();
        sellerUser.setEmail("seller-" + UUID.randomUUID() + "@test.com");
        sellerUser.setPasswordHash("hash");
        sellerUser.setRole(UserAccount.Role.SELLER);
        entityManager.persist(sellerUser);

        Seller seller = new Seller();
        seller.setName("Test Vendor");
        seller.setUser(sellerUser);
        entityManager.persist(seller);

        Category category = new Category();
        category.setName("Test Category " + UUID.randomUUID());
        entityManager.persist(category);

        PickupWindow window = new PickupWindow();
        window.setLabel("Test Window " + UUID.randomUUID());
        window.setStartTime(LocalTime.of(9, 0));
        window.setEndTime(LocalTime.of(17, 0));
        entityManager.persist(window);

        sharedPosting = new BundlePosting();
        sharedPosting.setSeller(seller);
        sharedPosting.setCategory(category);
        sharedPosting.setWindow(window);
        sharedPosting.setTitle("Surplus Bread");
        sharedPosting.setPriceCents(300);
        sharedPosting.setPickupStartAt(Instant.now());
        sharedPosting.setPickupEndAt(Instant.now().plusSeconds(3600));
        sharedPosting.setStatus(BundlePosting.Status.ACTIVE);
        entityManager.persist(sharedPosting);

        UserAccount orgUser = new UserAccount();
        orgUser.setEmail("org-" + UUID.randomUUID() + "@test.com");
        orgUser.setPasswordHash("hash");
        orgUser.setRole(UserAccount.Role.ORG_ADMIN);
        entityManager.persist(orgUser);

        sharedOrg = new Organisation();
        sharedOrg.setName("Helping Hearts");
        sharedOrg.setUser(orgUser);
        entityManager.persist(sharedOrg);

        entityManager.flush();
    }

    @Test
    void testSaveAndFindReservation() {
        Reservation reservation = new Reservation();
        reservation.setOrganisation(sharedOrg);
        reservation.setPosting(sharedPosting);
        reservation.setClaimCodeHash("hashed123");
        reservation.setClaimCodeLast4("0123");
        reservation.setStatus(Reservation.Status.RESERVED);

        Reservation saved = reservationRepo.save(reservation);
        entityManager.flush();
        entityManager.clear();

        Reservation found = reservationRepo.findById(saved.getReservationId()).orElse(null);

        assertNotNull(found);
        assertEquals(Reservation.Status.RESERVED, found.getStatus());
        assertEquals("0123", found.getClaimCodeLast4());
    }

    @Test
    void testUpdateStatusToCollected() {
        Reservation reservation = new Reservation();
        reservation.setOrganisation(sharedOrg);
        reservation.setPosting(sharedPosting);
        reservation.setClaimCodeHash("hash");
        reservation.setClaimCodeLast4("1234");
        reservation.setStatus(Reservation.Status.RESERVED);
        entityManager.persist(reservation);
        entityManager.flush();

        reservation.setStatus(Reservation.Status.COLLECTED);
        reservation.setCollectedAt(Instant.now());
        reservationRepo.save(reservation);
        entityManager.flush();

        Reservation updated = entityManager.find(Reservation.class, reservation.getReservationId());

        assertEquals(Reservation.Status.COLLECTED, updated.getStatus());
        assertNotNull(updated.getCollectedAt());
    }

    @Test
    void testFindReservationsByOrganisation() {
        Reservation reservation1 = new Reservation();
        reservation1.setOrganisation(sharedOrg);
        reservation1.setPosting(sharedPosting);
        reservation1.setClaimCodeHash("hash1");
        reservation1.setClaimCodeLast4("1111");
        reservation1.setStatus(Reservation.Status.RESERVED);
        entityManager.persist(reservation1);

        Reservation reservation2 = new Reservation();
        reservation2.setOrganisation(sharedOrg);
        reservation2.setPosting(sharedPosting);
        reservation2.setClaimCodeHash("hash2");
        reservation2.setClaimCodeLast4("2222");
        reservation2.setStatus(Reservation.Status.CANCELLED);
        entityManager.persist(reservation2);

        entityManager.flush();

        List<Reservation> results = reservationRepo.findByOrganisationOrgId(sharedOrg.getOrgId());

        assertEquals(2, results.size());
    }
}
