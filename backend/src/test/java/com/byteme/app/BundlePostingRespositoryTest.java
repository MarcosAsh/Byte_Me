package com.byteme.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class BundlePostingRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BundlePostingRepository bundleRepo;

    private Seller sharedSeller;
    private Category sharedCategory;

    @BeforeEach
    void setUp() {
        UserAccount user = new UserAccount();
        user.setEmail("user-" + UUID.randomUUID() + "@byteme.com");
        user.setPasswordHash("hash");
        user.setRole(UserAccount.Role.SELLER);
        entityManager.persist(user);

        sharedSeller = new Seller();
        sharedSeller.setName("Test Vendor");
        sharedSeller.setUser(user);
        entityManager.persist(sharedSeller);

        sharedCategory = new Category();
        sharedCategory.setName("Category-" + UUID.randomUUID());
        entityManager.persist(sharedCategory);

        entityManager.flush();
    }

    @Test
    void testFindAvailable() {
        Instant now = Instant.now();
        
        // Manual setup inside the test
        BundlePosting b = new BundlePosting();
        b.setSeller(sharedSeller);
        b.setCategory(sharedCategory);
        b.setTitle("Fresh Food");
        b.setStatus(BundlePosting.Status.ACTIVE);
        b.setQuantityTotal(10);
        b.setQuantityReserved(0);
        b.setPickupStartAt(now.minus(1, ChronoUnit.HOURS));
        b.setPickupEndAt(now.plus(1, ChronoUnit.HOURS));
        b.setPriceCents(500);
        entityManager.persist(b);

        entityManager.flush();

        Page<BundlePosting> result = bundleRepo.findAvailable(now, PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testCountBySeller() {
        // Must repeat the manual setup again here
        BundlePosting b = new BundlePosting();
        b.setSeller(sharedSeller);
        b.setCategory(sharedCategory);
        b.setTitle("Item 1");
        b.setStatus(BundlePosting.Status.ACTIVE);
        b.setQuantityTotal(1);
        b.setQuantityReserved(0);
        b.setPickupStartAt(Instant.now());
        b.setPickupEndAt(Instant.now().plus(1, ChronoUnit.HOURS));
        b.setPriceCents(100);
        entityManager.persist(b);

        entityManager.flush();

        long count = bundleRepo.countBySeller(sharedSeller.getSellerId());
        assertEquals(1, count);
    }
}