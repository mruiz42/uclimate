import time
from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import ProvidersDep
from app.models import LatLng, PointForecast, Units
from app.services.pick_hour import HOUR_S
from app.services.trip import weather_for_hour

router = APIRouter(tags=["weather"])


@router.get("/weather", response_model=PointForecast, summary="Hourly forecast for one point")
async def get_weather(
    providers: ProvidersDep,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    units: Units = "metric",
    hours: Annotated[int, Query(ge=1, le=384)] = 24,
) -> PointForecast:
    point = LatLng(lat=lat, lng=lng)
    (forecast,) = await providers.weather.hourly([point], units)
    current_hour = int(time.time()) // HOUR_S * HOUR_S
    upcoming = [i for i, t in enumerate(forecast.times) if t >= current_hour][:hours]
    return PointForecast(
        lat=lat,
        lng=lng,
        units=units,
        hours=[w for i in upcoming if (w := weather_for_hour(forecast, i)) is not None],
    )
