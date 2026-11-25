from datetime import UTC, datetime, timedelta

from app.models import LatLng, LineString, Route, Stop, TrackPoint, Trip, Units, Weather
from app.providers.base import HourlyForecast, Providers
from app.services.hazards import TrackSample, find_alerts, severity
from app.services.pick_hour import pick_hour
from app.services.sample_route import pick_stops, sample_route
from app.services.wmo import describe


async def build_trip(
    providers: Providers,
    origin: LatLng,
    destination: LatLng,
    units: Units,
    depart_at: datetime,
    interval_min: int,
    track_interval_km: float,
    max_track_points: int,
    max_stops: int,
) -> Trip:
    """Route -> dense track with ETAs -> one batched forecast -> hazards, plus listed stops.

    Every track point is checked for hazards; `interval_min` only decides which of them are
    listed as stops, so a sparse interval can't hide bad weather between stops.
    """
    route = await providers.routing.route(origin, destination)
    samples = sample_route(
        route.coordinates,
        route.duration_s,
        interval_m=track_interval_km * 1000,
        max_stops=max_track_points,
        segment_durations_s=route.segment_durations_s,
    )
    forecasts = await providers.weather.hourly(
        [LatLng(lat=s.lat, lng=s.lng) for s in samples],
        units,
        forecast_days=forecast_days_needed(depart_at, route.duration_s),
    )

    track: list[TrackSample] = []
    for sample, forecast in zip(samples, forecasts, strict=True):
        eta = depart_at + timedelta(seconds=sample.eta_s)
        track.append(
            TrackSample(
                lat=sample.lat,
                lng=sample.lng,
                distance_m=sample.distance_m,
                eta=eta,
                weather=weather_at(forecast, eta),
            )
        )

    stops = [
        Stop(
            lat=track[i].lat,
            lng=track[i].lng,
            distance_m=track[i].distance_m,
            eta_s=samples[i].eta_s,
            eta=track[i].eta,
            weather=track[i].weather,
        )
        for i in pick_stops(samples, interval_min * 60, max_stops)
    ]

    return Trip(
        route=Route(
            geometry=LineString(coordinates=route.coordinates),
            distance_m=route.distance_m,
            duration_s=route.duration_s,
        ),
        stops=stops,
        track=[
            TrackPoint(
                lat=t.lat,
                lng=t.lng,
                distance_m=t.distance_m,
                eta=t.eta,
                icon=t.weather.icon if t.weather else None,
                severity=severity(t.weather, units),
            )
            for t in track
        ],
        alerts=find_alerts(track, units),
        units=units,
        depart_at=depart_at,
        interval_min=interval_min,
    )


def forecast_days_needed(
    depart_at: datetime, duration_s: float, now: datetime | None = None
) -> int:
    """Forecast days (counted from today, UTC) that cover the whole drive; 1-16."""
    today = (now or datetime.now(UTC)).date()
    arrive = (depart_at + timedelta(seconds=duration_s)).astimezone(UTC).date()
    return min(max((arrive - today).days + 1, 1), 16)


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
        wind_gusts=forecast.wind_gusts[i] if i < len(forecast.wind_gusts) else None,
        precipitation_probability=forecast.precipitation_probability[i],
    )
