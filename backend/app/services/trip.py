from datetime import UTC, datetime, timedelta

from app.models import LatLng, LineString, Route, Stop, Trip, Units, Weather
from app.providers.base import HourlyForecast, Providers
from app.services.pick_hour import pick_hour
from app.services.sample_route import sample_route
from app.services.wmo import describe


async def build_trip(
    providers: Providers,
    origin: LatLng,
    destination: LatLng,
    units: Units,
    depart_at: datetime,
    interval_km: float,
    max_stops: int,
) -> Trip:
    """Route -> stops every `interval_km` with ETAs -> one batched forecast -> weather per stop."""
    route = await providers.routing.route(origin, destination)
    samples = sample_route(
        route.coordinates,
        route.duration_s,
        interval_m=interval_km * 1000,
        max_stops=max_stops,
        segment_durations_s=route.segment_durations_s,
    )
    forecasts = await providers.weather.hourly(
        [LatLng(lat=s.lat, lng=s.lng) for s in samples], units
    )

    stops = []
    for sample, forecast in zip(samples, forecasts, strict=True):
        eta = depart_at + timedelta(seconds=sample.eta_s)
        stops.append(
            Stop(
                lat=sample.lat,
                lng=sample.lng,
                distance_m=sample.distance_m,
                eta_s=sample.eta_s,
                eta=eta,
                weather=weather_at(forecast, eta),
            )
        )

    return Trip(
        route=Route(
            geometry=LineString(coordinates=route.coordinates),
            distance_m=route.distance_m,
            duration_s=route.duration_s,
        ),
        stops=stops,
        units=units,
        depart_at=depart_at,
    )


def weather_at(forecast: HourlyForecast, when: datetime) -> Weather | None:
    i = pick_hour(forecast.times, int(when.timestamp()))
    return None if i is None else weather_for_hour(forecast, i)


def weather_for_hour(forecast: HourlyForecast, i: int) -> Weather | None:
    temperature = forecast.temperature[i]
    code = forecast.weather_code[i]
    wind = forecast.wind_speed[i]
    if temperature is None or code is None or wind is None:
        return None
    description, icon = describe(code)
    return Weather(
        time=datetime.fromtimestamp(forecast.times[i], tz=UTC),
        temperature=temperature,
        temperature_unit=forecast.temperature_unit,
        weather_code=code,
        description=description,
        icon=icon,
        wind_speed=wind,
        wind_speed_unit=forecast.wind_speed_unit,
        wind_direction=forecast.wind_direction[i],
        precipitation_probability=forecast.precipitation_probability[i],
    )
