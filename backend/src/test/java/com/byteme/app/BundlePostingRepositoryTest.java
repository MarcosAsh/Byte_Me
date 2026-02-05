package com.byteme.app;

import java.time.Instant;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@DataJpaTest
class BundlePostingRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BundlePostingRepository bundleRepo;

    private Seller sharedSeller;
    private Category sharedCategory;
    private PickupWindow sharedWindow;

    @BeforeEach
    void setUp() {
        UserAccount user = new UserAccount();
        user.setEmail("test-" + UUID.randomUUID() + "@byteme.com");
        user.setPasswordHash("hash");
        user.setRole(UserAccount.Role.SELLER);
        entityManager.persist(user);

        sharedSeller = new Seller();
        sharedSeller.setName("Test Seller");
        sharedSeller.setUser(user);
        entityManager.persist(sharedSeller);

        sharedCategory = new Category();
        sharedCategory.setName("Test Category " + UUID.randomUUID());
        entityManager.persist(sharedCategory);

        sharedWindow = new PickupWindow();
        sharedWindow.setLabel("Test Window " + UUID.randomUUID());
        sharedWindow.setStartTime(LocalTime.of(9, 0));
        sharedWindow.setEndTime(LocalTime.of(17, 0));
        entityManager.persist(sharedWindow);

        entityManager.flush();
    }

    private BundlePosting createBundlePosting(String title, Integer priceCents, Instant pickupStart, Instant pickupEnd) {
        BundlePosting bp = new BundlePosting();
        bp.setSeller(sharedSeller);
        bp.setCategory(sharedCategory);
        bp.setWindow(sharedWindow);
        bp.setTitle(title);
        bp.setPriceCents(priceCents);
        bp.setPickupStartAt(pickupStart);
        bp.setPickupEndAt(pickupEnd);
        return bp;
    }

    @Test
    void testFindBySeller_SellerId() {
        BundlePosting b1 = createBundlePosting("Item 1", 100, Instant.now(), Instant.now().plus(1, ChronoUnit.HOURS));
        entityManager.persist(b1);

        entityManager.flush();

        List<List<BundlePosting>> results = List.of(bundleRepo.findBySeller_SellerId(sharedSeller.getSellerId()));
        assertEquals(1, results.get(0).size());
        assertEquals("Item 1", results.get(0).get(0).getTitle());
    }

    @Test
    void testFindAvailable_FiltersCorrectly() {
        Instant now = Instant.now();

        BundlePosting available = createBundlePosting("Available", 100, now.minus(1, ChronoUnit.HOURS), now.plus(1, ChronoUnit.HOURS));
        available.setStatus(BundlePosting.Status.ACTIVE);
        available.setQuantityTotal(5);
        available.setQuantityReserved(0);
        entityManager.persist(available);

        BundlePosting soldOut = createBundlePosting("Sold Out", 100, now.minus(1, ChronoUnit.HOURS), now.plus(1, ChronoUnit.HOURS));
        soldOut.setStatus(BundlePosting.Status.ACTIVE);
        soldOut.setQuantityTotal(5);
        soldOut.setQuantityReserved(5);
        entityManager.persist(soldOut);

        BundlePosting draft = createBundlePosting("Draft", 100, now.minus(1, ChronoUnit.HOURS), now.plus(1, ChronoUnit.HOURS));
        draft.setStatus(BundlePosting.Status.DRAFT);
        draft.setQuantityTotal(5);
        draft.setQuantityReserved(0);
        entityManager.persist(draft);

        BundlePosting past = createBundlePosting("Past", 100, now.minus(5, ChronoUnit.HOURS), now.minus(1, ChronoUnit.HOURS));
        past.setStatus(BundlePosting.Status.ACTIVE);
        past.setQuantityTotal(5);
        past.setQuantityReserved(0);
        entityManager.persist(past);

        entityManager.flush();

        Page<BundlePosting> page = bundleRepo.findAvailable(now, PageRequest.of(0, 10));
        assertEquals(1, page.getTotalElements());
        assertEquals("Available", page.getContent().get(0).getTitle());
    }

    @Test
    void testFindExpired() {
        Instant now = Instant.now();

        BundlePosting expired = createBundlePosting("Expired", 100, now.minus(10, ChronoUnit.HOURS), now.minus(2, ChronoUnit.HOURS));
        expired.setStatus(BundlePosting.Status.ACTIVE);
        entityManager.persist(expired);

        BundlePosting notExpired = createBundlePosting("Not Expired", 100, now.minus(1, ChronoUnit.HOURS), now.plus(1, ChronoUnit.HOURS));
        notExpired.setStatus(BundlePosting.Status.ACTIVE);
        entityManager.persist(notExpired);

        entityManager.flush();

        List<BundlePosting> expiredList = bundleRepo.findExpired(now);
        assertEquals(1, expiredList.size());
        assertEquals("Expired", expiredList.get(0).getTitle());
    }

    @Test
    void testCountBySeller() {
        BundlePosting b1 = createBundlePosting("B1", 100, Instant.now(), Instant.now().plus(1, ChronoUnit.HOURS));
        entityManager.persist(b1);

        entityManager.flush();

        long count = bundleRepo.countBySeller(sharedSeller.getSellerId());
        assertEquals(1, count);

        long countWrongId = bundleRepo.countBySeller(UUID.randomUUID());
        assertEquals(0, countWrongId);
    }
}
