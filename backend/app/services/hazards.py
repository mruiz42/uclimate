"""Spot hazardous driving weather along a densely sampled route.

The listed stops can be hours apart, so hazards are found on the dense track instead: a storm
cell or a snow band between two stops still produces an alert.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

from app.models import Alert, Hazard, Severity, Units, Weather

CAUTION: Severity = 1
WARNING: Severity = 2

THUNDERSTORM_CODES = {95, 96, 99}
FREEZING_CODES = {56, 57, 66, 67}
SNOW_CODES = {71, 73, 75, 77, 85, 86}
HEAVY_SNOW_CODES = {75, 86}
HEAVY_RAIN_CODES = {65, 82}
FOG_CODES = {45, 48}

# Gust thresholds (caution, warning) in the units the forecast was requested in.
GUST_THRESHOLDS: dict[Units, tuple[float, float]] = {"metric": (60, 80), "imperial": (37, 50)}
# A change at least this big within TEMP_SWING_WINDOW_M of driving is called out.
TEMP_SWING: dict[Units, float] = {"metric": 10, "imperial": 18}
TEMP_SWING_WINDOW_M = 50_000

LABELS: dict[Hazard, str] = {
    "thunderstorm": "Thunderstorms",
    "snow": "Snow",
    "freezing-rain": "Freezing rain",
    "heavy-rain": "Heavy rain",
    "fog": "Fog",
    "high-wind": "Strong gusts",
    "temp-swing": "Sharp temperature change",
}


@dataclass(frozen=True)
class TrackSample:
    """One dense point: where it is, when the driver reaches it, and the forecast then."""

    lat: float
    lng: float
    distance_m: float
    eta: datetime
    weather: Weather | None


def classify(weather: Weather, units: Units) -> list[tuple[Hazard, Severity]]:
    code = weather.weather_code
    found: list[tuple[Hazard, Severity]] = []
    if code in THUNDERSTORM_CODES:
        found.append(("thunderstorm", WARNING))
    if code in FREEZING_CODES:
        found.append(("freezing-rain", WARNING))
    if code in SNOW_CODES:
        found.append(("snow", WARNING if code in HEAVY_SNOW_CODES else CAUTION))
    if code in HEAVY_RAIN_CODES:
        found.append(("heavy-rain", CAUTION))
    if code in FOG_CODES:
        found.append(("fog", CAUTION))
    caution, warning = GUST_THRESHOLDS[units]
    if weather.wind_gusts is not None and weather.wind_gusts >= caution:
        found.append(("high-wind", WARNING if weather.wind_gusts >= warning else CAUTION))
    return found


def severity(weather: Weather | None, units: Units) -> Severity:
    """The worst hazard at one point, 0 when there is none (or no forecast)."""
    if weather is None:
        return 0
    return max((s for _, s in classify(weather, units)), default=0)


def find_alerts(samples: Sequence[TrackSample], units: Units) -> list[Alert]:
    """Merge consecutive points sharing a hazard into one alert, plus sharp temperature swings."""
    per_point = [dict(classify(s.weather, units)) if s.weather else {} for s in samples]
    alerts: list[Alert] = []
    for hazard in LABELS:
        if hazard == "temp-swing":
            continue
        i = 0
        while i < len(samples):
            if hazard not in per_point[i]:
                i += 1
                continue
            j = i
            while j + 1 < len(samples) and hazard in per_point[j + 1]:
                j += 1
            alerts.append(_span_alert(hazard, samples, per_point, i, j, units))
            i = j + 1
    alerts.extend(_temp_swings(samples, units))
    return sorted(alerts, key=lambda a: (a.start_distance_m, -a.severity))


def _span_alert(
    hazard: Hazard,
    samples: Sequence[TrackSample],
    per_point: Sequence[dict[Hazard, Severity]],
    start: int,
    end: int,
    units: Units,
) -> Alert:
    span = range(start, end + 1)
    worst = max(span, key=lambda k: (per_point[k][hazard], _gust(samples[k])))
    level = per_point[worst][hazard]
    description = LABELS[hazard]
    if hazard == "snow" and level == WARNING:
        description = "Heavy snow"
    elif hazard == "high-wind" and (w := samples[worst].weather) and w.wind_gusts is not None:
        description = f"Gusts up to {round(w.wind_gusts)} {w.wind_speed_unit}".rstrip()
    return Alert(
        hazard=hazard,
        severity=WARNING if level == WARNING else CAUTION,
        description=description,
        start_distance_m=samples[start].distance_m,
        end_distance_m=samples[end].distance_m,
        start_eta=samples[start].eta,
        end_eta=samples[end].eta,
        lat=samples[worst].lat,
        lng=samples[worst].lng,
    )


def _gust(sample: TrackSample) -> float:
    return (sample.weather.wind_gusts or 0) if sample.weather else 0


def _temp_swings(samples: Sequence[TrackSample], units: Units) -> list[Alert]:
    threshold = TEMP_SWING[units]
    alerts: list[Alert] = []
    i = 0
    while i < len(samples):
        a = samples[i].weather
        if a is None:
            i += 1
            continue
        best, best_delta = None, 0.0
        j = i + 1
        while j < len(samples) and samples[j].distance_m - samples[i].distance_m <= (
            TEMP_SWING_WINDOW_M
        ):
            b = samples[j].weather
            if b is not None and abs(b.temperature - a.temperature) > abs(best_delta):
                best, best_delta = j, b.temperature - a.temperature
            j += 1
        if best is None or abs(best_delta) < threshold:
            i += 1
            continue
        km = (samples[best].distance_m - samples[i].distance_m) / 1000
        distance = f"{round(km / 1.609344)} mi" if units == "imperial" else f"{round(km)} km"
        direction = "drops" if best_delta < 0 else "rises"
        alerts.append(
            Alert(
                hazard="temp-swing",
                severity=CAUTION,
                description=(
                    f"Temperature {direction} {round(abs(best_delta))}{a.temperature_unit}"
                    f" over {distance}"
                ),
                start_distance_m=samples[i].distance_m,
                end_distance_m=samples[best].distance_m,
                start_eta=samples[i].eta,
                end_eta=samples[best].eta,
                lat=samples[best].lat,
                lng=samples[best].lng,
            )
        )
        i = best  # continue from the end of this swing so swings don't overlap
    return alerts
