import re
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from pydantic import ValidationError

from app.config import Settings
from app.models import LatLng
from app.providers.base import Providers

LATLNG_PATTERN = r"^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$"


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_providers(request: Request) -> Providers:
    providers: Providers = request.app.state.providers
    return providers


SettingsDep = Annotated[Settings, Depends(get_settings)]
ProvidersDep = Annotated[Providers, Depends(get_providers)]


def parse_latlng(value: str, field: str) -> LatLng:
    """Parse a "lat,lng" query value, raising a 422 that names the field."""
    if not re.match(LATLNG_PATTERN, value):
        raise HTTPException(422, f"{field} must be 'lat,lng', e.g. 37.77,-122.42")
    lat, lng = (float(part) for part in value.split(","))
    try:
        return LatLng(lat=lat, lng=lng)
    except ValidationError as exc:
        raise HTTPException(422, f"{field} is out of range (lat ±90, lng ±180)") from exc
