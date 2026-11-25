"""Public API models (these shape the OpenAPI schema the client types are generated from)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Units = Literal["metric", "imperial"]


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
    precipitation_probability: float | None = Field(default=None, description="Percent")


class Stop(LatLng):
    distance_m: float = Field(description="Driving distance from the origin")
    eta_s: float = Field(description="Driving time from the origin")
    eta: datetime
    weather: Weather | None = Field(description="null when the ETA is beyond the forecast range")


class Trip(BaseModel):
    route: Route
    stops: list[Stop]
    units: Units
    depart_at: datetime


class PointForecast(LatLng):
    units: Units
    hours: list[Weather]
