package com.byteme.app;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

// Issue report controller
@RestController
@RequestMapping("/api/issues")
public class IssueController {

    // Repository dependencies
    private final IssueReportRepository issueRepo;
    private final ReservationRepository reservationRepo;
    private final OrganisationRepository orgRepo;
    private final SellerRepository sellerRepo;

    // Constructor injection
    public IssueController(IssueReportRepository issueRepo, ReservationRepository reservationRepo,
                           OrganisationRepository orgRepo, SellerRepository sellerRepo) {
        this.issueRepo = issueRepo;
        this.reservationRepo = reservationRepo;
        this.orgRepo = orgRepo;
        this.sellerRepo = sellerRepo;
    }

    // Get issues by seller
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<?> getBySeller(@PathVariable UUID sellerId) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return ResponseEntity.ok(issueRepo.findBySeller(sellerId));
    }

    // Get open issues by seller
    @GetMapping("/seller/{sellerId}/open")
    public ResponseEntity<?> getOpenBySeller(@PathVariable UUID sellerId) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var seller = sellerRepo.findById(sellerId).orElse(null);
        if (seller == null) return ResponseEntity.notFound().build();
        if (!seller.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return ResponseEntity.ok(issueRepo.findOpenBySeller(sellerId));
    }

    // Get issues by org
    @GetMapping("/org/{orgId}")
    public ResponseEntity<?> getByOrg(@PathVariable UUID orgId) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var org = orgRepo.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.notFound().build();
        if (!org.getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return ResponseEntity.ok(issueRepo.findByOrganisationOrgId(orgId));
    }

    // Create new issue
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateIssueRequest req) {
        IssueReport issue = new IssueReport();

        // Set reservation if provided
        if (req.getReservationId() != null) {
            issue.setReservation(reservationRepo.findById(req.getReservationId()).orElse(null));
        }
        // Set organisation if provided
        if (req.getOrgId() != null) {
            issue.setOrganisation(orgRepo.findById(req.getOrgId()).orElse(null));
        }

        issue.setType(req.getType());
        issue.setDescription(req.getDescription());

        return ResponseEntity.ok(issueRepo.save(issue));
    }

    // Respond to issue
    @PostMapping("/{id}/respond")
    @Transactional
    public ResponseEntity<?> respond(@PathVariable UUID id, @RequestBody RespondRequest req) {
        var issue = issueRepo.findById(id).orElse(null);
        if (issue == null) return ResponseEntity.notFound().build();

        // Set response
        issue.setSellerResponse(req.getResponse());
        issue.setStatus(IssueReport.Status.RESPONDED);

        // Mark resolved if requested
        if (req.isResolve()) {
            issue.setStatus(IssueReport.Status.RESOLVED);
            issue.setResolvedAt(Instant.now());
        }

        return ResponseEntity.ok(issueRepo.save(issue));
    }

    // Resolve issue
    @PostMapping("/{id}/resolve")
    @Transactional
    public ResponseEntity<?> resolve(@PathVariable UUID id) {
        var issue = issueRepo.findById(id).orElse(null);
        if (issue == null) return ResponseEntity.notFound().build();

        issue.setStatus(IssueReport.Status.RESOLVED);
        issue.setResolvedAt(Instant.now());

        return ResponseEntity.ok(issueRepo.save(issue));
    }

    // Create issue request data
    public static class CreateIssueRequest {
        private UUID reservationId;
        private UUID orgId;
        private IssueReport.Type type;
        private String description;

        public UUID getReservationId() { return reservationId; }
        public void setReservationId(UUID reservationId) { this.reservationId = reservationId; }
        public UUID getOrgId() { return orgId; }
        public void setOrgId(UUID orgId) { this.orgId = orgId; }
        public IssueReport.Type getType() { return type; }
        public void setType(IssueReport.Type type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // Respond request data
    public static class RespondRequest {
        private String response;
        private boolean resolve;

        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }
        public boolean isResolve() { return resolve; }
        public void setResolve(boolean resolve) { this.resolve = resolve; }
    }
}
