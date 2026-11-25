"""Provider interfaces. Each external service sits behind one of these so it can be swapped."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol

from app.models import LatLng, Place, Units


@dataclass(frozen=True)
class RouteResult:
    coordinates: list[tuple[float, float]]  # [lng, lat]
    distance_m: float
    duration_s: float
    segment_durations_s: list[float] | None  # one per coordinate pair, if the router provides it


@dataclass(frozen=True)
class HourlyForecast:
    times: list[int]  # unix seconds, hourly, sorted
    temperature: list[float | None]
    weather_code: list[int | None]
    wind_speed: list[float | None]
    wind_direction: list[float | None]
    precipitation_probability: list[float | None]
    temperature_unit: str
    wind_speed_unit: str


class RoutingProvider(Protocol):
    async def route(self, origin: LatLng, destination: LatLng) -> RouteResult: ...


class GeocodingProvider(Protocol):
    async def search(
        self, query: str, bias: LatLng | None, limit: int, lang: str | None = None
    ) -> list[Place]: ...

    async def reverse(self, point: LatLng, lang: str | None = None) -> Place | None:
        """`lang` is a BCP 47 tag (e.g. "en-US"); providers ignore languages they can't serve."""
        ...


class WeatherProvider(Protocol):
    async def hourly(self, points: Sequence[LatLng], units: Units) -> list[HourlyForecast]:
        """One forecast per point, in the same order."""
        ...


@dataclass(frozen=True)
class Providers:
    routing: RoutingProvider
    geocoding: GeocodingProvider
    weather: WeatherProvider
