from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import LATLNG_PATTERN, ProvidersDep, SettingsDep, parse_latlng
from app.models import Trip, Units
from app.services.trip import build_trip

router = APIRouter(tags=["trip"])

LatLngQuery = Annotated[
    str, Query(pattern=LATLNG_PATTERN, description="'lat,lng'", examples=["37.3382,-121.8863"])
]


@router.get(
    "/trip",
    response_model=Trip,
    summary="Driving route with forecast weather at each stop",
    responses={404: {"description": "No drivable route"}, 502: {"description": "Upstream failure"}},
)
async def get_trip(
    providers: ProvidersDep,
    settings: SettingsDep,
    origin: LatLngQuery,
    destination: LatLngQuery,
    units: Units = "metric",
    depart_at: Annotated[
        datetime | None, Query(description="ISO 8601; defaults to now. Naive times are UTC.")
    ] = None,
) -> Trip:
    when = depart_at or datetime.now(UTC)
    if when.tzinfo is None:
        when = when.replace(tzinfo=UTC)
    return await build_trip(
        providers,
        parse_latlng(origin, "origin"),
        parse_latlng(destination, "destination"),
        units,
        when,
        interval_km=settings.sample_interval_km,
        max_stops=settings.max_stops,
    )
