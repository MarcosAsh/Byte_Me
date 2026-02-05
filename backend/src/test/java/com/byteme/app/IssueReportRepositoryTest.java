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
class IssueReportRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private IssueReportRepository issueRepo;

    private Organisation sharedOrg;
    private Seller sharedSeller;
    private Reservation sharedReservation;

    @BeforeEach
    void setUp() {
        UserAccount sellerUser = new UserAccount();
        sellerUser.setEmail("seller-" + UUID.randomUUID() + "@byteme.com");
        sellerUser.setPasswordHash("secure_hash");
        sellerUser.setRole(UserAccount.Role.SELLER);
        entityManager.persist(sellerUser);

        sharedSeller = new Seller();
        sharedSeller.setName("The Salty Grocer");
        sharedSeller.setUser(sellerUser);
        entityManager.persist(sharedSeller);

        UserAccount orgUser = new UserAccount();
        orgUser.setEmail("org-" + UUID.randomUUID() + "@byteme.com");
        orgUser.setPasswordHash("secure_hash");
        orgUser.setRole(UserAccount.Role.ORG_ADMIN);
        entityManager.persist(orgUser);

        sharedOrg = new Organisation();
        sharedOrg.setName("Helping Hands NGO");
        sharedOrg.setUser(orgUser);
        entityManager.persist(sharedOrg);

        Category category = new Category();
        category.setName("Test Category " + UUID.randomUUID());
        entityManager.persist(category);

        PickupWindow window = new PickupWindow();
        window.setLabel("Test Window " + UUID.randomUUID());
        window.setStartTime(LocalTime.of(9, 0));
        window.setEndTime(LocalTime.of(17, 0));
        entityManager.persist(window);

        BundlePosting posting = new BundlePosting();
        posting.setSeller(sharedSeller);
        posting.setCategory(category);
        posting.setWindow(window);
        posting.setTitle("Leftover Pastries");
        posting.setPriceCents(500);
        posting.setPickupStartAt(Instant.now());
        posting.setPickupEndAt(Instant.now().plusSeconds(3600));
        posting.setStatus(BundlePosting.Status.ACTIVE);
        entityManager.persist(posting);

        sharedReservation = new Reservation();
        sharedReservation.setOrganisation(sharedOrg);
        sharedReservation.setPosting(posting);
        sharedReservation.setClaimCodeHash("hash123");
        sharedReservation.setClaimCodeLast4("1234");
        sharedReservation.setStatus(Reservation.Status.RESERVED);
        entityManager.persist(sharedReservation);

        entityManager.flush();
    }

    @Test
    void testFindByOrganisationOrgId() {
        IssueReport issue = new IssueReport();
        issue.setReservation(sharedReservation);
        issue.setOrganisation(sharedOrg);
        issue.setType(IssueReport.Type.QUALITY);
        issue.setDescription("Order was incomplete");
        issue.setStatus(IssueReport.Status.OPEN);
        entityManager.persist(issue);
        entityManager.flush();

        List<IssueReport> results = issueRepo.findByOrganisationOrgId(sharedOrg.getOrgId());

        assertEquals(1, results.size());
        assertEquals(sharedOrg.getOrgId(), results.get(0).getOrganisation().getOrgId());
    }

    @Test
    void testFindBySeller() {
        IssueReport issue = new IssueReport();
        issue.setReservation(sharedReservation);
        issue.setOrganisation(sharedOrg);
        issue.setType(IssueReport.Type.QUALITY);
        issue.setDescription("Quality concern");
        issue.setStatus(IssueReport.Status.RESPONDED);
        entityManager.persist(issue);
        entityManager.flush();

        List<IssueReport> results = issueRepo.findBySeller(sharedSeller.getSellerId());

        assertFalse(results.isEmpty());
        assertEquals(sharedSeller.getSellerId(),
            results.get(0).getReservation().getPosting().getSeller().getSellerId());
    }

    @Test
    void testFindOpenBySeller() {
        IssueReport openIssue = new IssueReport();
        openIssue.setReservation(sharedReservation);
        openIssue.setOrganisation(sharedOrg);
        openIssue.setType(IssueReport.Type.QUALITY);
        openIssue.setDescription("Critical Issue");
        openIssue.setStatus(IssueReport.Status.OPEN);
        entityManager.persist(openIssue);

        IssueReport resolvedIssue = new IssueReport();
        resolvedIssue.setReservation(sharedReservation);
        resolvedIssue.setOrganisation(sharedOrg);
        resolvedIssue.setType(IssueReport.Type.QUALITY);
        resolvedIssue.setDescription("Fixed Issue");
        resolvedIssue.setStatus(IssueReport.Status.RESOLVED);
        entityManager.persist(resolvedIssue);

        entityManager.flush();

        List<IssueReport> openIssues = issueRepo.findOpenBySeller(sharedSeller.getSellerId());

        assertEquals(1, openIssues.size());
        assertEquals(IssueReport.Status.OPEN, openIssues.get(0).getStatus());
    }
}
