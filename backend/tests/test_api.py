"""API routes end to end, with fake providers injected (no network)."""

from collections.abc import Iterator, Sequence
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.errors import NotFoundError, UpstreamError
from app.main import create_app
from app.models import LatLng, Place, Units
from app.providers.base import HourlyForecast, Providers, RouteResult

DEPART = datetime(2026, 1, 1, 12, tzinfo=UTC)
T0 = int(DEPART.timestamp())


class FakeRouting:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error

    async def route(self, origin: LatLng, destination: LatLng) -> RouteResult:
        if self.error:
            raise self.error
        # ~333 km due east, 3 hours.
        return RouteResult(
            coordinates=[(0.0, 0.0), (1.5, 0.0), (3.0, 0.0)],
            distance_m=333_000,
            duration_s=3 * 3600,
            segment_durations_s=None,
        )


class FakeGeocoding:
    async def search(
        self, query: str, bias: LatLng | None, limit: int, lang: str | None = None
    ) -> list[Place]:
        return [Place(id="1", label=f"{query} ({'biased' if bias else 'global'})", lat=1, lng=2)]

    async def reverse(self, point: LatLng, lang: str | None = None) -> Place | None:
        return None if point.lat == 0 else Place(id="r", label="Here", lat=point.lat, lng=point.lng)


class FakeWeather:
    def __init__(self) -> None:
        self.points: list[LatLng] = []

    async def hourly(self, points: Sequence[LatLng], units: Units) -> list[HourlyForecast]:
        self.points = list(points)
        n = 6  # forecast covers 6 hours from departure
        return [
            HourlyForecast(
                times=[T0 + h * 3600 for h in range(n)],
                temperature=[float(h) for h in range(n)],
                weather_code=[61] * n,
                wind_speed=[10.0] * n,
                wind_direction=[270.0] * n,
                precipitation_probability=[50.0] * n,
                temperature_unit="°C" if units == "metric" else "°F",
                wind_speed_unit="km/h",
            )
            for _ in points
        ]


def make_client(
    routing: FakeRouting | None = None, weather: FakeWeather | None = None
) -> TestClient:
    providers = Providers(
        routing=routing or FakeRouting(),
        geocoding=FakeGeocoding(),
        weather=weather or FakeWeather(),
    )
    settings = Settings(sample_interval_km=100, _env_file=None)
    return TestClient(create_app(settings, providers))


@pytest.fixture
def client() -> Iterator[TestClient]:
    with make_client() as c:
        yield c


def test_trip(client: TestClient) -> None:
    r = client.get(
        "/api/trip",
        params={
            "origin": "0,0",
            "destination": "0,3",
            "units": "imperial",
            "depart_at": DEPART.isoformat(),
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["units"] == "imperial"
    assert body["route"]["geometry"]["coordinates"][0] == [0.0, 0.0]
    stops = body["stops"]
    assert len(stops) == 5  # 0, 100, 200, 300 km and the destination (~333 km)
    assert stops[0]["weather"]["temperature"] == 0
    # Destination ETA is 3h after departure -> the 3rd forecast hour.
    assert stops[-1]["eta"].startswith("2026-01-01T15:00")
    assert stops[-1]["weather"]["temperature"] == 3
    assert stops[-1]["weather"]["description"] == "Light rain"
    assert stops[-1]["weather"]["temperature_unit"] == "°F"


def test_trip_beyond_forecast_has_null_weather() -> None:
    with make_client() as c:
        r = c.get(
            "/api/trip",
            params={"origin": "0,0", "destination": "0,3", "depart_at": "2026-01-01T20:00:00"},
        )  # naive -> UTC
    assert r.status_code == 200
    assert all(s["weather"] is None for s in r.json()["stops"])


@pytest.mark.parametrize(
    "params",
    [
        {"origin": "abc", "destination": "0,3"},
        {"origin": "0,0"},
        {"origin": "95,0", "destination": "0,3"},
        {"origin": "0,0", "destination": "0,3", "units": "kelvin"},
    ],
)
def test_trip_validation(client: TestClient, params: dict[str, str]) -> None:
    assert client.get("/api/trip", params=params).status_code == 422


def test_trip_no_route() -> None:
    with make_client(routing=FakeRouting(NotFoundError("No drivable route"))) as c:
        r = c.get("/api/trip", params={"origin": "37.3,-121.9", "destination": "21.3,-157.9"})
    assert r.status_code == 404
    assert "No drivable route" in r.json()["detail"]


def test_trip_upstream_failure() -> None:
    with make_client(routing=FakeRouting(UpstreamError("osrm", "HTTP 503"))) as c:
        r = c.get("/api/trip", params={"origin": "0,0", "destination": "0,3"})
    assert r.status_code == 502
    assert "osrm" in r.json()["detail"]


def test_search(client: TestClient) -> None:
    r = client.get("/api/geocode/search", params={"q": " paris ", "lat": 48.8, "lng": 2.3})
    assert r.json()[0]["label"] == "paris (biased)"
    r = client.get("/api/geocode/search", params={"q": "paris"})
    assert r.json()[0]["label"] == "paris (global)"
    assert client.get("/api/geocode/search", params={"q": "p"}).status_code == 422


def test_reverse(client: TestClient) -> None:
    assert (
        client.get("/api/geocode/reverse", params={"lat": 48.85, "lng": 2.35}).json()["label"]
        == "Here"
    )
    assert client.get("/api/geocode/reverse", params={"lat": 0, "lng": 0}).status_code == 404


def test_weather_point(client: TestClient) -> None:
    r = client.get("/api/weather", params={"lat": 1, "lng": 2})
    assert r.status_code == 200
    assert r.json()["units"] == "metric"


def test_health_and_openapi(client: TestClient) -> None:
    assert client.get("/api/health").json() == {"status": "ok"}
    paths = client.get("/openapi.json").json()["paths"]
    assert {"/api/trip", "/api/geocode/search", "/api/geocode/reverse", "/api/weather"} <= set(
        paths
    )
