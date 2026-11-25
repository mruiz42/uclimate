"""Pick evenly spaced points along a route, with driving distance and time from the start."""

import math
from bisect import bisect_left
from collections.abc import Sequence
from dataclasses import dataclass
from itertools import accumulate

EARTH_RADIUS_M = 6_371_008.8


@dataclass(frozen=True)
class SamplePoint:
    lat: float
    lng: float
    distance_m: float
    eta_s: float


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance between two [lng, lat] points, in metres."""
    lng1, lat1, lng2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


def sample_route(
    coordinates: Sequence[tuple[float, float]],
    total_duration_s: float,
    interval_m: float,
    max_stops: int,
    segment_durations_s: Sequence[float] | None = None,
) -> list[SamplePoint]:
    """Return stops at the origin, every `interval_m` along the route, and the destination.

    `coordinates` are [lng, lat] pairs. Per-segment durations (from the router) give exact
    ETAs; without them, or if they don't line up with the geometry, time is spread in
    proportion to distance. If the interval would produce more than `max_stops`, it is
    widened. A regular stop that falls within a quarter interval of the destination is
    dropped so the last two markers don't sit on top of each other.
    """
    if interval_m <= 0:
        raise ValueError("interval_m must be positive")
    if max_stops < 2:
        raise ValueError("max_stops must be at least 2")
    if not coordinates:
        return []

    seg_dist = [
        haversine_m(coordinates[i], coordinates[i + 1]) for i in range(len(coordinates) - 1)
    ]
    cum_dist = [0.0, *accumulate(seg_dist)]
    total_m = cum_dist[-1]

    lng0, lat0 = coordinates[0]
    if total_m == 0:
        return [SamplePoint(lat=lat0, lng=lng0, distance_m=0.0, eta_s=0.0)]

    if segment_durations_s is not None and len(segment_durations_s) == len(seg_dist):
        seg_time = list(segment_durations_s)
    else:
        seg_time = [total_duration_s * d / total_m for d in seg_dist]
    cum_time = [0.0, *accumulate(seg_time)]

    if total_m / interval_m + 1 > max_stops:
        interval_m = total_m / (max_stops - 1)

    targets = [i * interval_m for i in range(math.ceil(total_m / interval_m))]
    if len(targets) > 1 and total_m - targets[-1] < interval_m / 4:
        targets.pop()
    targets.append(total_m)

    points = []
    for target in targets:
        # Segment i spans cum_dist[i]..cum_dist[i+1]; find the one containing target.
        i = min(max(bisect_left(cum_dist, target) - 1, 0), len(seg_dist) - 1)
        span = seg_dist[i]
        f = (target - cum_dist[i]) / span if span > 0 else 0.0
        (lng_a, lat_a), (lng_b, lat_b) = coordinates[i], coordinates[i + 1]
        points.append(
            SamplePoint(
                lat=lat_a + (lat_b - lat_a) * f,
                lng=lng_a + (lng_b - lng_a) * f,
                distance_m=target,
                eta_s=cum_time[i] + seg_time[i] * f,
            )
        )
    return points


def pick_stops(samples: Sequence[SamplePoint], interval_s: float, max_stops: int) -> list[int]:
    """Indices of the samples to list as stops: the origin, one per `interval_s` of driving
    (the sample nearest each multiple), and the destination.

    The interval widens if it would give more than `max_stops`. A pick within a quarter
    interval of the destination is dropped, as in `sample_route`.
    """
    if interval_s <= 0:
        raise ValueError("interval_s must be positive")
    if max_stops < 2:
        raise ValueError("max_stops must be at least 2")
    n = len(samples)
    if n <= 2:
        return list(range(n))

    total_s = samples[-1].eta_s
    if total_s / interval_s + 1 > max_stops:
        interval_s = total_s / (max_stops - 1)
    targets = [k * interval_s for k in range(1, math.ceil(total_s / interval_s))]
    if targets and total_s - targets[-1] < interval_s / 4:
        targets.pop()

    etas = [s.eta_s for s in samples]
    picked = [0]
    for target in targets:
        i = bisect_left(etas, target)
        if i > 0 and (i == n or target - etas[i - 1] <= etas[i] - target):
            i -= 1
        i = min(max(i, 1), n - 2)
        if i > picked[-1]:
            picked.append(i)
    picked.append(n - 1)
    return picked
