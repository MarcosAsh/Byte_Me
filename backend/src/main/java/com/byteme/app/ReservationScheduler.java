package com.byteme.app;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class ReservationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationScheduler.class);

    private final ReservationRepository reservationRepo;

    public ReservationScheduler(ReservationRepository reservationRepo) {
        this.reservationRepo = reservationRepo;
    }

    // Run every 5 minutes
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void markExpiredAndNoShow() {
        Instant now = Instant.now();

        List<Reservation> overdue = reservationRepo
                .findByStatusAndPostingPickupEndAtBefore(Reservation.Status.RESERVED, now);

        int expiredCount = 0;
        int noShowCount = 0;

        for (Reservation r : overdue) {
            // If the reservation was never collected and the pickup window has passed,
            // mark as NO_SHOW if the pickup window has started (they were expected),
            // otherwise EXPIRED (window passed before it even opened, e.g. cancelled posting)
            if (r.getPosting().getPickupStartAt().isBefore(now)) {
                r.setStatus(Reservation.Status.NO_SHOW);
                r.setNoShowMarkedAt(now);
                noShowCount++;
            } else {
                r.setStatus(Reservation.Status.EXPIRED);
                r.setExpiredMarkedAt(now);
                expiredCount++;
            }
        }

        if (!overdue.isEmpty()) {
            reservationRepo.saveAll(overdue);
            log.info("Auto-marked {} no-show and {} expired reservations", noShowCount, expiredCount);
        }
    }
}
