"""Public API models (these shape the OpenAPI schema the client types are generated from)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Units = Literal["metric", "imperial"]
Hazard = Literal[
    "thunderstorm", "snow", "freezing-rain", "heavy-rain", "fog", "high-wind", "temp-swing"
]
Severity = Literal[0, 1, 2]  # none, caution, warning


class LatLng(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Place(LatLng):
    id: str
    label: str


class LineString(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]] = Field(description="[lng, lat] pairs (GeoJSON order)")


class Route(BaseModel):
    geometry: LineString
    distance_m: float
    duration_s: float


class Weather(BaseModel):
    time: datetime = Field(description="Start of the forecast hour (UTC)")
    temperature: float
    temperature_unit: str
    weather_code: int = Field(description="WMO weather interpretation code")
    description: str
    icon: str
    wind_speed: float
    wind_speed_unit: str
    wind_direction: float | None = Field(default=None, description="Degrees, meteorological")
    wind_gusts: float | None = Field(default=None, description="Same unit as wind_speed")
    precipitation_probability: float | None = Field(default=None, description="Percent")


class Stop(LatLng):
    distance_m: float = Field(description="Driving distance from the origin")
    eta_s: float = Field(description="Driving time from the origin")
    eta: datetime
    weather: Weather | None = Field(description="null when the ETA is beyond the forecast range")


class TrackPoint(LatLng):
    """A densely spaced point checked for hazards; drives the colored route line."""

    distance_m: float
    eta: datetime
    icon: str | None = Field(description="Weather icon key; null beyond the forecast range")
    severity: Severity


class Alert(BaseModel):
    """A stretch of route with hazardous weather, found from the dense track."""

    hazard: Hazard
    severity: Literal[1, 2] = Field(description="1 caution, 2 warning")
    description: str
    start_distance_m: float
    end_distance_m: float
    start_eta: datetime
    end_eta: datetime
    lat: float = Field(description="Location of the worst point in the stretch")
    lng: float


class Trip(BaseModel):
    route: Route
    stops: list[Stop]
    track: list[TrackPoint]
    alerts: list[Alert]
    units: Units
    depart_at: datetime
    interval_min: int = Field(description="Driving time between listed stops")


class PointForecast(LatLng):
    units: Units
    hours: list[Weather]
