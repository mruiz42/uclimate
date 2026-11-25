import pytest

from app.services.sample_route import haversine_m, sample_route

# A straight east-west line along the equator: 1 degree of longitude ≈ 111.195 km.
DEG_M = haversine_m((0, 0), (1, 0))
LINE = [(float(x), 0.0) for x in range(0, 11)]  # 10 segments, ~1112 km


def test_haversine_known_distance() -> None:
    # San Francisco -> Los Angeles, about 559 km great-circle.
    assert haversine_m((-122.4194, 37.7749), (-118.2437, 34.0522)) == pytest.approx(
        559_000, rel=0.01
    )


def test_endpoints_and_spacing() -> None:
    stops = sample_route(LINE, total_duration_s=36_000, interval_m=200_000, max_stops=40)
    assert (stops[0].lng, stops[0].lat, stops[0].eta_s) == (0, 0, 0)
    assert stops[-1].lng == pytest.approx(10)
    assert stops[-1].distance_m == pytest.approx(10 * DEG_M)
    assert stops[-1].eta_s == pytest.approx(36_000)
    gaps = [b.distance_m - a.distance_m for a, b in zip(stops, stops[1:], strict=False)]
    assert all(g == pytest.approx(200_000) for g in gaps[:-1])


def test_distance_and_eta_monotonic() -> None:
    stops = sample_route(LINE, total_duration_s=36_000, interval_m=150_000, max_stops=40)
    assert [s.distance_m for s in stops] == sorted(s.distance_m for s in stops)
    assert [s.eta_s for s in stops] == sorted(s.eta_s for s in stops)


def test_uses_segment_durations_when_aligned() -> None:
    # First half takes 9h, second half 1h: the midpoint ETA should be 9h, not 5h.
    durations = [9 * 3600 / 5] * 5 + [3600 / 5] * 5
    stops = sample_route(
        LINE,
        total_duration_s=10 * 3600,
        interval_m=5 * DEG_M,
        max_stops=40,
        segment_durations_s=durations,
    )
    assert len(stops) == 3
    assert stops[1].eta_s == pytest.approx(9 * 3600)


def test_misaligned_durations_fall_back_to_proportional() -> None:
    stops = sample_route(
        LINE,
        total_duration_s=10_000,
        interval_m=5 * DEG_M,
        max_stops=40,
        segment_durations_s=[1.0, 2.0],
    )
    assert stops[1].eta_s == pytest.approx(5_000)


def test_interval_widens_to_respect_max_stops() -> None:
    stops = sample_route(LINE, total_duration_s=1, interval_m=1_000, max_stops=5)
    assert len(stops) == 5


def test_drops_stop_too_close_to_destination() -> None:
    # 1112 km at 370 km spacing -> regular stops at 0, 370, 741, 1111.9; the last is
    # ~0.3 km from the end, so it's dropped in favour of the destination itself.
    interval = 10 * DEG_M / 3 - 100
    stops = sample_route(LINE, total_duration_s=1, interval_m=interval, max_stops=40)
    assert len(stops) == 4
    assert stops[-1].distance_m == pytest.approx(10 * DEG_M)


def test_short_route_gives_origin_and_destination() -> None:
    stops = sample_route([(0, 0), (0.01, 0)], total_duration_s=60, interval_m=80_000, max_stops=40)
    assert len(stops) == 2
    assert stops[-1].eta_s == pytest.approx(60)


def test_zero_length_route() -> None:
    assert len(sample_route([(1, 1), (1, 1)], 0, 80_000, 40)) == 1
    assert sample_route([], 0, 80_000, 40) == []


@pytest.mark.parametrize("interval,max_stops", [(0, 10), (1000, 1)])
def test_invalid_arguments(interval: float, max_stops: int) -> None:
    with pytest.raises(ValueError):
        sample_route(LINE, 1, interval, max_stops)
