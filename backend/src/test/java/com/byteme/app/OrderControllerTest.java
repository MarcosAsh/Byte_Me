package com.byteme.app;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class OrderControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private ReservationRepository reservationRepo;
    @Mock private BundlePostingRepository bundleRepo;
    @Mock private OrganisationRepository orgRepo;
    @Mock private OrganisationStreakCacheRepository streakRepo;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        ObjectMapper testMapper = new ObjectMapper();
        testMapper.registerModule(new JavaTimeModule());
        testMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(testMapper))
                .build();

        when(passwordEncoder.encode(any())).thenReturn("encoded");
    }

    @Test
    void testCreateOrder_InsufficientStock() throws Exception {
        UUID bundleId = UUID.randomUUID();

        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityTotal(5);
        bundle.setQuantityReserved(5); // Fully booked
        bundle.setStatus(BundlePosting.Status.ACTIVE);

        OrderController.CreateOrderRequest req = new OrderController.CreateOrderRequest();
        req.setPostingId(bundleId);

        when(bundleRepo.findById(bundleId)).thenReturn(Optional.of(bundle));

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("No bundles available")));
    }

    @Test
    void testCreateOrder_Success() throws Exception {
        UUID bundleId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        BundlePosting bundle = new BundlePosting();
        bundle.setPriceCents(1000);
        bundle.setDiscountPct(0);
        bundle.setQuantityTotal(10);
        bundle.setQuantityReserved(0);
        bundle.setStatus(BundlePosting.Status.ACTIVE);

        Seller seller = new Seller();
        seller.setName("Test Shop");
        seller.setLocationText("Test Lane");
        bundle.setSeller(seller);

        when(bundleRepo.findById(bundleId)).thenReturn(Optional.of(bundle));
        when(orgRepo.findById(any())).thenReturn(Optional.of(new Organisation()));
        when(reservationRepo.save(any())).thenAnswer(i -> {
            Reservation r = i.getArgument(0);
            r.setReservationId(UUID.randomUUID());
            return r;
        });

        OrderController.CreateOrderRequest req = new OrderController.CreateOrderRequest();
        req.setPostingId(bundleId);
        req.setOrgId(orgId);

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(1));

        assertEquals(1, bundle.getQuantityReserved());
    }

    @Test
    void testCollect_Success() throws Exception {
        UUID reservationId = UUID.randomUUID();
        Organisation org = new Organisation();
        org.setOrgId(UUID.randomUUID());

        Reservation reservation = new Reservation();
        reservation.setStatus(Reservation.Status.RESERVED);
        reservation.setOrganisation(org);
        reservation.setClaimCodeHash("hashedcode");

        when(reservationRepo.findById(reservationId)).thenReturn(Optional.of(reservation));
        when(streakRepo.findById(any())).thenReturn(Optional.empty());
        when(streakRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(post("/api/orders/{id}/collect", reservationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(Reservation.Status.COLLECTED, reservation.getStatus());
    }

    @Test
    void testCancel_Success() throws Exception {
        UUID reservationId = UUID.randomUUID();
        BundlePosting bundle = new BundlePosting();
        bundle.setQuantityReserved(5);

        Reservation reservation = new Reservation();
        reservation.setStatus(Reservation.Status.RESERVED);
        reservation.setPosting(bundle);

        when(reservationRepo.findById(reservationId)).thenReturn(Optional.of(reservation));
        when(reservationRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(post("/api/orders/{id}/cancel", reservationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(4, bundle.getQuantityReserved());
    }

    @Test
    void testGetBySeller() throws Exception {
        UUID sellerId = UUID.randomUUID();
        when(reservationRepo.findByPostingSellerSellerId(sellerId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/orders/seller/{sellerId}", sellerId))
                .andExpect(status().isOk());
    }
}
