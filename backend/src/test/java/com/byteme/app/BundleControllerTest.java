package com.byteme.app;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class BundleControllerTest {

    private BundlePostingRepository bundleRepo;
    private SellerRepository sellerRepo;
    private CategoryRepository categoryRepo;
    private BundleController controller;
    private UUID mockUserId;

    @BeforeEach
    void setUp() {
        
        bundleRepo = mock(BundlePostingRepository.class);
        sellerRepo = mock(SellerRepository.class);
        categoryRepo = mock(CategoryRepository.class);

        controller = new BundleController(bundleRepo, sellerRepo, categoryRepo);
        
        mockUserId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(mockUserId, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testGetById_NotFound() {
        UUID id = UUID.randomUUID();
        
        when(bundleRepo.findById(id)).thenReturn(Optional.empty());

        ResponseEntity<BundlePosting> response = controller.getById(id);

        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void testActivateBundle() {
        UUID id = UUID.randomUUID();
        BundlePosting bundle = new BundlePosting();
        bundle.setStatus(BundlePosting.Status.DRAFT);
        
        when(bundleRepo.findById(id)).thenReturn(Optional.of(bundle));
        
        when(bundleRepo.save(any(BundlePosting.class))).thenAnswer(i -> i.getArguments()[0]);

        ResponseEntity<?> response = controller.activate(id);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(BundlePosting.Status.ACTIVE, bundle.getStatus());
    }
}