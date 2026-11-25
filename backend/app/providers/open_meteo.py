"""Open-Meteo hourly forecast. https://open-meteo.com/en/docs"""

from collections.abc import Sequence
from typing import Any

import httpx

from app.cache import Cache
from app.errors import UpstreamError
from app.http import get_json
from app.models import LatLng, Units
from app.providers.base import HourlyForecast

SERVICE = "open-meteo"
WEATHER_TTL_S = 30 * 60
BATCH_SIZE = 50  # keeps request URLs a sensible length
HOURLY_VARS = (
    "temperature_2m",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "precipitation_probability",
)
# Open-Meteo's own labels, normalised for display (it reports mph as "mp/h").
UNIT_LABELS = {"km/h": "km/h", "mp/h": "mph", "mph": "mph", "m/s": "m/s", "kn": "kn"}
UNIT_PARAMS: dict[str, dict[str, str]] = {
    "metric": {"temperature_unit": "celsius", "wind_speed_unit": "kmh"},
    "imperial": {"temperature_unit": "fahrenheit", "wind_speed_unit": "mph"},
}


class OpenMeteoWeather:
    def __init__(self, client: httpx.AsyncClient, base_url: str, cache: Cache | None = None):
        self._client = client
        self._base = base_url.rstrip("/")
        self._cache = cache

    async def hourly(self, points: Sequence[LatLng], units: Units) -> list[HourlyForecast]:
        forecasts: list[HourlyForecast] = []
        for start in range(0, len(points), BATCH_SIZE):
            batch = points[start : start + BATCH_SIZE]
            params: dict[str, str | int | float] = {
                # ~1 km precision is finer than the model grid and makes cache hits likelier.
                "latitude": ",".join(f"{p.lat:.2f}" for p in batch),
                "longitude": ",".join(f"{p.lng:.2f}" for p in batch),
                "hourly": ",".join(HOURLY_VARS),
                "timeformat": "unixtime",
                "timezone": "GMT",
                "forecast_days": 16,
                **UNIT_PARAMS[units],
            }
            body = await get_json(
                self._client,
                SERVICE,
                f"{self._base}/v1/forecast",
                params,
                cache=self._cache,
                ttl_s=WEATHER_TTL_S,
            )
            # A single location comes back as an object, several as a list.
            locations = body if isinstance(body, list) else [body]
            if len(locations) != len(batch):
                raise UpstreamError(SERVICE, "location count mismatch")
            forecasts.extend(parse_location(loc) for loc in locations)
        return forecasts


def parse_location(loc: Any) -> HourlyForecast:
    try:
        hourly = loc["hourly"]
        units = loc.get("hourly_units") or {}
        return HourlyForecast(
            times=[int(t) for t in hourly["time"]],
            temperature=hourly["temperature_2m"],
            weather_code=hourly["weather_code"],
            wind_speed=hourly["wind_speed_10m"],
            wind_direction=hourly["wind_direction_10m"],
            precipitation_probability=hourly.get("precipitation_probability")
            or [None] * len(hourly["time"]),
            temperature_unit=units.get("temperature_2m", ""),
            wind_speed_unit=UNIT_LABELS.get(units.get("wind_speed_10m", ""), ""),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise UpstreamError(SERVICE, "malformed forecast") from exc
