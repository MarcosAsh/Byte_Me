package com.byteme.app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BundlePostingTest {

    @Test
    void testCanReserveWhenAvailable() {
        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityTotal(5);
        bundle.setQuantityReserved(2);
        bundle.setStatus(BundlePosting.Status.ACTIVE);
        
        assertTrue(bundle.canReserve(2));
    }

    @Test
    void testCanReserveWhenNotEnough() {
        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityTotal(5);
        bundle.setQuantityReserved(2);
        bundle.setStatus(BundlePosting.Status.ACTIVE);
        
        assertFalse(bundle.canReserve(4));
    }

    @Test
    void testCanReserveWhenNotActive() {
        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityTotal(5);
        bundle.setQuantityReserved(0);
        bundle.setStatus(BundlePosting.Status.DRAFT);
        
        assertFalse(bundle.canReserve(1));
    }

    @Test
    void testGetAvailable() {
        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityTotal(10);
        bundle.setQuantityReserved(3);
        
        assertEquals(7, bundle.getAvailable());
    }
}