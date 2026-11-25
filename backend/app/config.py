from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All runtime configuration. This is the only place the environment is read."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    osrm_url: str = "https://router.project-osrm.org"
    photon_url: str = "https://photon.komoot.io"
    open_meteo_url: str = "https://api.open-meteo.com"

    # Which implementation backs each capability (see app/providers/__init__.py).
    routing_provider: Literal["osrm"] = "osrm"
    geocoding_provider: Literal["photon"] = "photon"
    weather_provider: Literal["open-meteo"] = "open-meteo"

    # The route is checked for hazards every `track_interval_km` (at most `max_track_points`
    # points); the stops listed for the user are a subset chosen by driving time.
    track_interval_km: float = Field(default=10, gt=0)
    max_track_points: int = Field(default=200, ge=2, le=500)
    max_stops: int = Field(default=40, ge=2, le=100)

    http_timeout_s: float = Field(default=10, gt=0)
    user_agent: str = "uclimate/1.0"

    cors_origins: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
