package com.byteme.app;

import com.byteme.app.Reservation.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AnalyticsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BundlePostingRepository bundleRepo;
    @Mock
    private ReservationRepository reservationRepo;
    @Mock
    private IssueReportRepository issueRepo;
    @Mock
    private SellerRepository sellerRepo;

    @InjectMocks
    private AnalyticsController analyticsController;

    private final UUID sellerId = UUID.randomUUID();

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController).build();
    }

    @Test
    void testGetDashboardSuccess() throws Exception {
        
        Seller seller = new Seller();
        seller.setName("Green Grocery");
        when(sellerRepo.findById(sellerId)).thenReturn(Optional.of(seller));

        
        BundlePosting b1 = new BundlePosting();
        b1.setQuantityTotal(10);
        when(bundleRepo.findBySeller_SellerId(sellerId)).thenReturn(Collections.singletonList(b1));

        
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.COLLECTED))
                .thenReturn(Arrays.asList(new Reservation(), new Reservation()));
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.NO_SHOW)).thenReturn(Collections.emptyList());
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.EXPIRED)).thenReturn(Collections.emptyList());
        
        
        when(issueRepo.findOpenBySeller(sellerId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/analytics/dashboard/" + sellerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerName").value("Green Grocery"))
                .andExpect(jsonPath("$.totalQuantity").value(10))
                .andExpect(jsonPath("$.collectedCount").value(2))
                .andExpect(jsonPath("$.sellThroughRate").value(20.0)); 
    }

    @Test
    void testGetDashboardNotFound() throws Exception {
        when(sellerRepo.findById(sellerId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/analytics/dashboard/" + sellerId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetWasteMetrics() throws Exception {
        
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.COLLECTED))
                .thenReturn(Arrays.asList(new Reservation(), new Reservation(), new Reservation()));

        mockMvc.perform(get("/api/analytics/waste/" + sellerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bundlesCollected").value(3))
                .andExpect(jsonPath("$.weightSavedGrams").value(900)) 
                .andExpect(jsonPath("$.co2eSavedKg").value(2.25));
    }

    @Test
    void testGetSellThrough() throws Exception {
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.COLLECTED))
                .thenReturn(Collections.singletonList(new Reservation()));
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.NO_SHOW))
                .thenReturn(Collections.singletonList(new Reservation()));
        when(reservationRepo.findBySellerAndStatus(sellerId, Status.EXPIRED))
                .thenReturn(Collections.emptyList());

        
        mockMvc.perform(get("/api/analytics/sell-through/" + sellerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collectionRate").value(50.0))
                .andExpect(jsonPath("$.noShowRate").value(50.0));
    }
}