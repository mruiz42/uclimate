import pytest

from app.services.pick_hour import pick_hour
from app.services.wmo import WMO_CODES, describe

TIMES = [0, 3600, 7200, 10800]


@pytest.mark.parametrize(
    "target,expected",
    [
        (0, 0),
        (1799, 0),
        (1801, 1),
        (7200, 2),
        (10800 + 3600, 3),  # within an hour after the last slot
        (-3600, 0),  # within an hour before the first slot
    ],
)
def test_nearest_hour(target: int, expected: int) -> None:
    assert pick_hour(TIMES, target) == expected


@pytest.mark.parametrize("target", [-3601, 10800 + 3601])
def test_outside_range(target: int) -> None:
    assert pick_hour(TIMES, target) is None


def test_empty() -> None:
    assert pick_hour([], 0) is None


def test_wmo_known_and_unknown() -> None:
    assert describe(0) == ("Clear sky", "clear")
    assert describe(95)[1] == "thunderstorm"
    assert describe(42) == ("Unknown", "unknown")
    assert all(desc and icon for desc, icon in WMO_CODES.values())
