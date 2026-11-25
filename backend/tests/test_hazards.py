from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from app.models import Units, Weather
from app.services.hazards import TrackSample, classify, find_alerts, severity
from app.services.trip import forecast_days_needed

T0 = datetime(2026, 1, 1, 12, tzinfo=UTC)


def weather(
    code: int = 0, temp: float = 10, gusts: float | None = None, units: Units = "metric"
) -> Weather:
    return Weather(
        time=T0,
        temperature=temp,
        temperature_unit="°C" if units == "metric" else "°F",
        weather_code=code,
        description="",
        icon="",
        wind_speed=10,
        wind_speed_unit="km/h" if units == "metric" else "mph",
        wind_gusts=gusts,
    )


def track(weathers: Sequence[Weather | None], spacing_km: float = 10) -> list[TrackSample]:
    return [
        TrackSample(
            lat=0,
            lng=i * 0.1,
            distance_m=i * spacing_km * 1000,
            eta=T0 + timedelta(minutes=6 * i),
            weather=w,
        )
        for i, w in enumerate(weathers)
    ]


def test_classify_codes() -> None:
    assert classify(weather(0), "metric") == []
    assert classify(weather(61), "metric") == []  # light rain isn't a hazard
    assert classify(weather(95), "metric") == [("thunderstorm", 2)]
    assert classify(weather(67), "metric") == [("freezing-rain", 2)]
    assert classify(weather(71), "metric") == [("snow", 1)]
    assert classify(weather(75), "metric") == [("snow", 2)]
    assert classify(weather(65), "metric") == [("heavy-rain", 1)]
    assert classify(weather(45), "metric") == [("fog", 1)]


def test_classify_gusts_by_units() -> None:
    assert classify(weather(gusts=59), "metric") == []
    assert classify(weather(gusts=60), "metric") == [("high-wind", 1)]
    assert classify(weather(gusts=85), "metric") == [("high-wind", 2)]
    assert classify(weather(gusts=40, units="imperial"), "imperial") == [("high-wind", 1)]
    assert classify(weather(gusts=36, units="imperial"), "imperial") == []


def test_severity() -> None:
    assert severity(None, "metric") == 0
    assert severity(weather(0), "metric") == 0
    assert severity(weather(71, gusts=90), "metric") == 2


def test_find_alerts_merges_runs() -> None:
    w = [weather(0), weather(73), weather(75), weather(73), weather(0), weather(73)]
    alerts = find_alerts(track(w), "metric")
    assert [(a.hazard, a.severity, a.start_distance_m, a.end_distance_m) for a in alerts] == [
        ("snow", 2, 10_000, 30_000),
        ("snow", 1, 50_000, 50_000),
    ]
    assert alerts[0].description == "Heavy snow"
    assert alerts[0].lng == 0.2  # the worst point
    assert alerts[1].description == "Snow"


def test_find_alerts_skips_missing_forecasts() -> None:
    assert find_alerts(track([None, weather(95), None]), "metric")[0].start_distance_m == 10_000


def test_find_alerts_gust_description() -> None:
    (alert,) = find_alerts(track([weather(gusts=65), weather(gusts=72)]), "metric")
    assert alert.description == "Gusts up to 72 km/h"
    assert alert.lng == 0.1


def test_temp_swing_within_window() -> None:
    temps = [20, 18, 14, 9, 9, 9]  # 11 °C drop over 30 km
    (alert,) = find_alerts(track([weather(temp=t) for t in temps]), "metric")
    assert alert.hazard == "temp-swing"
    assert alert.description == "Temperature drops 11°C over 30 km"
    assert (alert.start_distance_m, alert.end_distance_m) == (0, 30_000)


def test_temp_swing_ignores_gradual_change() -> None:
    temps = [20 - 1.5 * i for i in range(10)]  # 13.5 °C, but only 7.5 °C in any 50 km
    assert find_alerts(track([weather(temp=t) for t in temps]), "metric") == []


def test_temp_swing_imperial() -> None:
    temps = [70, 50]
    (alert,) = find_alerts(
        track([weather(temp=t, units="imperial") for t in temps], spacing_km=16.1), "imperial"
    )
    assert alert.description == "Temperature drops 20°F over 10 mi"


def test_forecast_days_needed() -> None:
    now = datetime(2026, 1, 1, 8, tzinfo=UTC)
    assert forecast_days_needed(now, 3600, now) == 1
    assert forecast_days_needed(now + timedelta(hours=14), 3600, now) == 1
    assert forecast_days_needed(now + timedelta(hours=15), 3600, now) == 2  # arrives Jan 2
    assert forecast_days_needed(now - timedelta(days=3), 3600, now) == 1
    assert forecast_days_needed(now + timedelta(days=30), 0, now) == 16
