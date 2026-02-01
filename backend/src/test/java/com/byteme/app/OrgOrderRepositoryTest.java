package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class OrgOrderRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrgOrderRepository orderRepo;

    private Organisation sharedOrg;
    private BundlePosting sharedPosting;

    @BeforeEach
    void setUp() {
        // 1. Setup Seller side (User -> Seller -> Posting)
        UserAccount sellerUser = new UserAccount();
        sellerUser.setEmail("seller-" + UUID.randomUUID() + "@test.com");
        sellerUser.setPasswordHash("hash");
        sellerUser.setRole(UserAccount.Role.SELLER);
        entityManager.persist(sellerUser);

        Seller seller = new Seller();
        seller.setName("Test Vendor");
        seller.setUser(sellerUser);
        entityManager.persist(seller);

        sharedPosting = new BundlePosting();
        sharedPosting.setSeller(seller);
        sharedPosting.setTitle("Surplus Bread");
        sharedPosting.setPriceCents(300);
        sharedPosting.setPickupStartAt(Instant.now());
        sharedPosting.setPickupEndAt(Instant.now().plusSeconds(3600));
        sharedPosting.setStatus(BundlePosting.Status.ACTIVE);
        entityManager.persist(sharedPosting);

        // 2. Setup Buyer side (User -> Organisation)
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
    void testSaveAndFindOrder() {
        // Arrange
        OrgOrder order = new OrgOrder();
        order.setOrganisation(sharedOrg);
        order.setPosting(sharedPosting);
        order.setQuantity(3);
        order.setTotalPriceCents(900);
        order.setStatus(OrgOrder.Status.RESERVED);

        // Act
        OrgOrder saved = orderRepo.save(order);
        entityManager.flush();
        entityManager.clear();

        OrgOrder found = orderRepo.findById(saved.getOrderId()).orElse(null);

        // Assert
        assertNotNull(found);
        assertEquals(OrgOrder.Status.RESERVED, found.getStatus());
        assertEquals(3, found.getQuantity());
        assertEquals(sharedOrg.getOrgId(), found.getOrganisation().getOrgId());
    }

    @Test
    void testUpdateStatusToCollected() {
        // Arrange
        OrgOrder order = createOrder(OrgOrder.Status.RESERVED);
        
        // Act
        order.setStatus(OrgOrder.Status.COLLECTED);
        order.setCollectedAt(Instant.now());
        orderRepo.save(order);
        entityManager.flush();

        OrgOrder updated = entityManager.find(OrgOrder.class, order.getOrderId());
        
        // Assert
        assertEquals(OrgOrder.Status.COLLECTED, updated.getStatus());
        assertNotNull(updated.getCollectedAt());
    }

    @Test
    void testFindOrdersByOrganisation() {
        // Arrange
        createOrder(OrgOrder.Status.RESERVED);
        createOrder(OrgOrder.Status.CANCELLED);
        entityManager.flush();

        // Act - This assumes you have findByOrganisation_OrgId in your Repository
        List<OrgOrder> results = orderRepo.findAll().stream()
                .filter(o -> o.getOrganisation().getOrgId().equals(sharedOrg.getOrgId()))
                .toList();

        // Assert
        assertEquals(2, results.size());
    }

    // Helper to keep the actual test methods clean
    private OrgOrder createOrder(OrgOrder.Status status) {
        OrgOrder order = new OrgOrder();
        order.setOrganisation(sharedOrg);
        order.setPosting(sharedPosting);
        order.setQuantity(1);
        order.setTotalPriceCents(300);
        order.setStatus(status);
        return entityManager.persist(order);
    }
}