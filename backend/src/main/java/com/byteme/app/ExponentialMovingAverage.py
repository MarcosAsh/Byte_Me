# EMA forecasting for Byte Me demand observations
# Reads from the DB (or uses sample data) and predicts reservations + no-show rates
#
# Run without args for a demo, or pass a seller UUID to query the database:
#   python ExponentialMovingAverage.py
#   python ExponentialMovingAverage.py 80000000-0000-0000-0000-000000000001 --alpha 0.3

import argparse
import sys

try:
    import psycopg2
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False


def compute_ema(values, alpha=0.3):
    # basic EMA: each new value gets weight alpha, previous EMA gets (1-alpha)
    if not values:
        return 0.0
    ema = values[0]
    for v in values[1:]:
        ema = alpha * v + (1 - alpha) * ema
    return ema


def forecast_from_observations(observations, alpha=0.3):
    # takes a list of observation dicts sorted by date, returns EMA prediction
    if not observations:
        print("No observations to forecast from.")
        return None

    reservations = [o['observed_reservations'] for o in observations]
    no_show_rates = [o['observed_no_show_rate'] for o in observations]

    ema_reservations = compute_ema(reservations, alpha)
    ema_no_show = compute_ema(no_show_rates, alpha)

    # more data = more confident, caps at 0.85
    confidence = min(0.4 + len(observations) * 0.03, 0.85)

    return {
        'predicted_reservations': round(ema_reservations, 1),
        'predicted_no_show_prob': round(ema_no_show, 3),
        'confidence': round(confidence, 2),
        'data_points': len(observations),
        'alpha': alpha,
    }


def fetch_observations_from_db(seller_id, db_url, db_user, db_password):
    # pulls demand_observation rows from postgres for the given seller
    if not HAS_PSYCOPG2:
        print("psycopg2 not installed - run: pip install psycopg2-binary")
        return []

    conn = psycopg2.connect(db_url, user=db_user, password=db_password)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT date, observed_reservations, observed_no_show_rate
            FROM demand_observation
            WHERE seller_id = %s
            ORDER BY date ASC
        """, (seller_id,))
        rows = cur.fetchall()
        return [
            {
                'date': str(row[0]),
                'observed_reservations': row[1],
                'observed_no_show_rate': float(row[2]),
            }
            for row in rows
        ]
    finally:
        conn.close()


def run_demo():
    # sample data based on our seed observations for Sourdough & Co bakery
    print("Running EMA demo with sample data (no DB connection)\n")

    sample_observations = [
        {'date': '2025-11-21', 'observed_reservations': 8,  'observed_no_show_rate': 0.20},
        {'date': '2025-11-28', 'observed_reservations': 10, 'observed_no_show_rate': 0.15},
        {'date': '2025-12-05', 'observed_reservations': 9,  'observed_no_show_rate': 0.19},
        {'date': '2025-12-12', 'observed_reservations': 11, 'observed_no_show_rate': 0.14},
        {'date': '2025-12-19', 'observed_reservations': 12, 'observed_no_show_rate': 0.13},
        {'date': '2025-12-26', 'observed_reservations': 10, 'observed_no_show_rate': 0.17},
        {'date': '2026-01-02', 'observed_reservations': 13, 'observed_no_show_rate': 0.12},
        {'date': '2026-01-09', 'observed_reservations': 14, 'observed_no_show_rate': 0.11},
        {'date': '2026-01-16', 'observed_reservations': 12, 'observed_no_show_rate': 0.15},
        {'date': '2026-01-23', 'observed_reservations': 15, 'observed_no_show_rate': 0.10},
        {'date': '2026-01-30', 'observed_reservations': 16, 'observed_no_show_rate': 0.09},
        {'date': '2026-02-06', 'observed_reservations': 17, 'observed_no_show_rate': 0.08},
    ]

    print("Observations (Bakery, 17:00-18:00, 40% discount):")
    print(f"  {'Date':<12} {'Reservations':>13} {'No-Show Rate':>13}")
    for obs in sample_observations:
        print(f"  {obs['date']:<12} {obs['observed_reservations']:>13} {obs['observed_no_show_rate']:>13.2f}")

    # try a few different smoothing factors to show the effect
    for alpha in [0.2, 0.3, 0.5]:
        result = forecast_from_observations(sample_observations, alpha=alpha)
        print(f"\nEMA Forecast (alpha={alpha}):")
        print(f"  Predicted reservations: {result['predicted_reservations']}")
        print(f"  Predicted no-show prob: {result['predicted_no_show_prob']}")
        print(f"  Confidence:             {result['confidence']}")
        print(f"  Data points used:       {result['data_points']}")


def main():
    parser = argparse.ArgumentParser(description='EMA forecasting for Byte Me demand data')
    parser.add_argument('seller_id', nargs='?', help='Seller UUID to forecast for')
    parser.add_argument('--alpha', type=float, default=0.3, help='EMA smoothing factor (default: 0.3)')
    parser.add_argument('--db-url', default='postgresql://localhost:5432/byteMe', help='Database URL')
    parser.add_argument('--db-user', default='postgres', help='Database user')
    parser.add_argument('--db-password', default='postgres', help='Database password')
    args = parser.parse_args()

    if not args.seller_id:
        run_demo()
        return

    print(f"Fetching observations for seller {args.seller_id}...")
    observations = fetch_observations_from_db(args.seller_id, args.db_url, args.db_user, args.db_password)

    if not observations:
        print("No observations found.")
        sys.exit(1)

    print(f"Found {len(observations)} observations.\n")
    result = forecast_from_observations(observations, alpha=args.alpha)

    print(f"EMA Forecast (alpha={args.alpha}):")
    print(f"  Predicted reservations: {result['predicted_reservations']}")
    print(f"  Predicted no-show prob: {result['predicted_no_show_prob']}")
    print(f"  Confidence:             {result['confidence']}")
    print(f"  Data points used:       {result['data_points']}")


if __name__ == '__main__':
    main()
