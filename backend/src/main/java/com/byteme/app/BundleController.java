package com.byteme.app;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Bundle posting controller
@RestController
@RequestMapping("/api/bundles")
public class BundleController {

    // Repository dependencies
    private final BundlePostingRepository bundleRepo;
    private final SellerRepository sellerRepo;
    private final CategoryRepository categoryRepo;

    // Constructor injection
    public BundleController(BundlePostingRepository bundleRepo, SellerRepository sellerRepo, CategoryRepository categoryRepo) {
        this.bundleRepo = bundleRepo;
        this.sellerRepo = sellerRepo;
        this.categoryRepo = categoryRepo;
    }

    // Get available bundles
    @GetMapping
    public Page<BundlePosting> getAvailable(Pageable pageable) {
        return bundleRepo.findAvailable(Instant.now(), pageable);
    }

    // Get bundle by id
    @GetMapping("/{id}")
    public ResponseEntity<BundlePosting> getById(@PathVariable UUID id) {
        return bundleRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get bundles by seller
    @GetMapping("/seller/{sellerId}")
    public List<BundlePosting> getBySeller(@PathVariable UUID sellerId) {
        return bundleRepo.findBySeller_SellerId(sellerId);
    }

    // Create new bundle
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateBundleRequest req) {
        // Get current seller
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var seller = sellerRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Not a seller"));

        // Build bundle entity
        BundlePosting bundle = new BundlePosting();
        bundle.setSeller(seller);
        if (req.getCategoryId() != null) {
            bundle.setCategory(categoryRepo.findById(req.getCategoryId()).orElse(null));
        }
        bundle.setTitle(req.getTitle());
        bundle.setDescription(req.getDescription());
        bundle.setPickupStartAt(req.getPickupStartAt());
        bundle.setPickupEndAt(req.getPickupEndAt());
        bundle.setQuantityTotal(req.getQuantityTotal());
        bundle.setQuantityReserved(0);
        bundle.setPriceCents(req.getPriceCents());
        bundle.setDiscountPct(req.getDiscountPct() != null ? req.getDiscountPct() : 0);
        bundle.setAllergensText(req.getAllergensText());
        bundle.setStatus(req.isActivate() ? BundlePosting.Status.ACTIVE : BundlePosting.Status.DRAFT);

        return ResponseEntity.ok(bundleRepo.save(bundle));
    }

    // Update existing bundle
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody UpdateBundleRequest req) {
        var bundle = bundleRepo.findById(id).orElse(null);
        if (bundle == null) return ResponseEntity.notFound().build();

        // Check ownership
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!bundle.getSeller().getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Not your bundle");
        }

        // Update fields if provided
        if (req.getTitle() != null) bundle.setTitle(req.getTitle());
        if (req.getDescription() != null) bundle.setDescription(req.getDescription());
        if (req.getQuantityTotal() != null) bundle.setQuantityTotal(req.getQuantityTotal());
        if (req.getPriceCents() != null) bundle.setPriceCents(req.getPriceCents());
        if (req.getDiscountPct() != null) bundle.setDiscountPct(req.getDiscountPct());
        if (req.getAllergensText() != null) bundle.setAllergensText(req.getAllergensText());

        return ResponseEntity.ok(bundleRepo.save(bundle));
    }

    // Activate bundle
    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable UUID id) {
        var bundle = bundleRepo.findById(id).orElse(null);
        if (bundle == null) return ResponseEntity.notFound().build();
        bundle.setStatus(BundlePosting.Status.ACTIVE);
        return ResponseEntity.ok(bundleRepo.save(bundle));
    }

    // Close bundle
    @PostMapping("/{id}/close")
    public ResponseEntity<?> close(@PathVariable UUID id) {
        var bundle = bundleRepo.findById(id).orElse(null);
        if (bundle == null) return ResponseEntity.notFound().build();
        bundle.setStatus(BundlePosting.Status.CLOSED);
        return ResponseEntity.ok(bundleRepo.save(bundle));
    }

    // Create bundle request data
    public static class CreateBundleRequest {
        private UUID categoryId;
        private String title;
        private String description;
        private Instant pickupStartAt;
        private Instant pickupEndAt;
        private Integer quantityTotal;
        private Integer priceCents;
        private Integer discountPct;
        private String allergensText;
        private boolean activate;

        public CreateBundleRequest() {}

        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Instant getPickupStartAt() { return pickupStartAt; }
        public void setPickupStartAt(Instant pickupStartAt) { this.pickupStartAt = pickupStartAt; }
        public Instant getPickupEndAt() { return pickupEndAt; }
        public void setPickupEndAt(Instant pickupEndAt) { this.pickupEndAt = pickupEndAt; }
        public Integer getQuantityTotal() { return quantityTotal; }
        public void setQuantityTotal(Integer quantityTotal) { this.quantityTotal = quantityTotal; }
        public Integer getPriceCents() { return priceCents; }
        public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
        public Integer getDiscountPct() { return discountPct; }
        public void setDiscountPct(Integer discountPct) { this.discountPct = discountPct; }
        public String getAllergensText() { return allergensText; }
        public void setAllergensText(String allergensText) { this.allergensText = allergensText; }
        public boolean isActivate() { return activate; }
        public void setActivate(boolean activate) { this.activate = activate; }
    }

    // Update bundle request data
    public static class UpdateBundleRequest {
        private String title;
        private String description;
        private Integer quantityTotal;
        private Integer priceCents;
        private Integer discountPct;
        private String allergensText;

        public UpdateBundleRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Integer getQuantityTotal() { return quantityTotal; }
        public void setQuantityTotal(Integer quantityTotal) { this.quantityTotal = quantityTotal; }
        public Integer getPriceCents() { return priceCents; }
        public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
        public Integer getDiscountPct() { return discountPct; }
        public void setDiscountPct(Integer discountPct) { this.discountPct = discountPct; }
        public String getAllergensText() { return allergensText; }
        public void setAllergensText(String allergensText) { this.allergensText = allergensText; }
    }
}
