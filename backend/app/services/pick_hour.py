from bisect import bisect_left
from collections.abc import Sequence

HOUR_S = 3600


def pick_hour(times: Sequence[int], target: int) -> int | None:
    """Index of the forecast hour nearest to `target` (unix seconds).

    `times` are sorted hourly unix timestamps. Returns None when `target` is more than
    an hour outside the forecast range.
    """
    if not times or target < times[0] - HOUR_S or target > times[-1] + HOUR_S:
        return None
    i = bisect_left(times, target)
    if i == 0:
        return 0
    if i == len(times):
        return len(times) - 1
    return i if times[i] - target < target - times[i - 1] else i - 1
