"""Provider parsing and HTTP handling, with upstream services mocked by respx (no network)."""

from collections.abc import AsyncIterator

import httpx
import pytest
import respx

from app.cache import MemoryCache
from app.errors import NotFoundError, UpstreamError
from app.models import LatLng
from app.providers.open_meteo import OpenMeteoWeather
from app.providers.osrm import OsrmRouting
from app.providers.photon import PhotonGeocoding, build_label

A = LatLng(lat=37.33, lng=-121.88)
B = LatLng(lat=34.05, lng=-118.24)


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient() as c:
        yield c


def osrm_body(code: str = "Ok") -> dict[str, object]:
    return {
        "code": code,
        "routes": [
            {
                "distance": 200.0,
                "duration": 20.0,
                "geometry": {"type": "LineString", "coordinates": [[0, 0], [0.001, 0], [0.002, 0]]},
                "legs": [{"annotation": {"duration": [5.0, 15.0]}}],
            }
        ],
    }


@respx.mock
async def test_osrm_route(client: httpx.AsyncClient) -> None:
    route = respx.get(
        url__startswith="https://osrm.test/route/v1/driving/-121.88,37.33;-118.24,34.05"
    )
    route.respond(json=osrm_body())
    result = await OsrmRouting(client, "https://osrm.test/").route(A, B)
    assert result.coordinates[-1] == (0.002, 0)
    assert result.segment_durations_s == [5.0, 15.0]
    assert route.calls.last.request.url.params["geometries"] == "geojson"


@respx.mock
async def test_osrm_no_route_is_404(client: httpx.AsyncClient) -> None:
    respx.get(url__startswith="https://osrm.test/").respond(400, json={"code": "NoRoute"})
    with pytest.raises(NotFoundError):
        await OsrmRouting(client, "https://osrm.test").route(A, B)


@respx.mock
async def test_osrm_server_error_is_upstream(client: httpx.AsyncClient) -> None:
    respx.get(url__startswith="https://osrm.test/").respond(503, text="busy")
    with pytest.raises(UpstreamError):
        await OsrmRouting(client, "https://osrm.test").route(A, B)


@respx.mock
async def test_osrm_network_error_is_upstream(client: httpx.AsyncClient) -> None:
    respx.get(url__startswith="https://osrm.test/").mock(side_effect=httpx.ConnectTimeout("t/o"))
    with pytest.raises(UpstreamError):
        await OsrmRouting(client, "https://osrm.test").route(A, B)


@respx.mock
async def test_cache_avoids_second_request(client: httpx.AsyncClient) -> None:
    mock = respx.get(url__startswith="https://osrm.test/").respond(json=osrm_body())
    osrm = OsrmRouting(client, "https://osrm.test", MemoryCache())
    await osrm.route(A, B)
    await osrm.route(A, B)
    assert mock.call_count == 1


PHOTON_BODY = {
    "features": [
        {
            "geometry": {"coordinates": [2.2945, 48.8584]},
            "properties": {
                "osm_type": "W",
                "osm_id": 5013364,
                "name": "Eiffel Tower",
                "city": "Paris",
                "state": "Ile-de-France",
                "country": "France",
            },
        },
        {  # duplicate id is dropped
            "geometry": {"coordinates": [2.2945, 48.8584]},
            "properties": {"osm_type": "W", "osm_id": 5013364, "name": "Eiffel Tower"},
        },
        {"geometry": {}, "properties": {}},  # malformed is skipped
    ]
}


@respx.mock
async def test_photon_search(client: httpx.AsyncClient) -> None:
    mock = respx.get("https://photon.test/api").respond(json=PHOTON_BODY)
    places = await PhotonGeocoding(client, "https://photon.test").search(
        "eiffel", LatLng(lat=48.86, lng=2.35), 5
    )
    assert [p.label for p in places] == ["Eiffel Tower, Paris, Ile-de-France, France"]
    assert (places[0].id, places[0].lat, places[0].lng) == ("W5013364", 48.8584, 2.2945)
    params = mock.calls.last.request.url.params
    assert (params["q"], params["lat"], params["lon"]) == ("eiffel", "48.9", "2.4")


@respx.mock
async def test_photon_reverse_empty(client: httpx.AsyncClient) -> None:
    respx.get("https://photon.test/reverse").respond(json={"features": []})
    assert await PhotonGeocoding(client, "https://photon.test").reverse(A) is None


def test_build_label_street_address_and_dedupe() -> None:
    props = {
        "housenumber": "1",
        "street": "Main St",
        "city": "Springfield",
        "state": "Springfield",
        "country": "United States",
    }
    assert build_label(props) == "1 Main St, Springfield, United States"


def meteo_location(temp: float) -> dict[str, object]:
    return {
        "hourly_units": {"temperature_2m": "°F", "wind_speed_10m": "mp/h"},
        "hourly": {
            "time": [0, 3600],
            "temperature_2m": [temp, temp + 1],
            "weather_code": [0, 61],
            "wind_speed_10m": [5.0, 6.0],
            "wind_direction_10m": [90, 180],
            "precipitation_probability": [0, 80],
        },
    }


@respx.mock
async def test_open_meteo_batches_points(client: httpx.AsyncClient) -> None:
    mock = respx.get("https://meteo.test/v1/forecast").respond(
        json=[meteo_location(50), meteo_location(60)]
    )
    forecasts = await OpenMeteoWeather(client, "https://meteo.test").hourly([A, B], "imperial")
    assert [f.temperature[0] for f in forecasts] == [50, 60]
    assert forecasts[0].temperature_unit == "°F"
    assert forecasts[0].wind_speed_unit == "mph"  # normalised from Open-Meteo's "mp/h"
    params = mock.calls.last.request.url.params
    assert params["latitude"] == "37.33,34.05"
    assert params["temperature_unit"] == "fahrenheit"
    assert params["timeformat"] == "unixtime"


@respx.mock
async def test_open_meteo_single_point_object(client: httpx.AsyncClient) -> None:
    respx.get("https://meteo.test/v1/forecast").respond(json=meteo_location(10))
    (forecast,) = await OpenMeteoWeather(client, "https://meteo.test").hourly([A], "metric")
    assert forecast.weather_code == [0, 61]


@respx.mock
async def test_open_meteo_malformed(client: httpx.AsyncClient) -> None:
    respx.get("https://meteo.test/v1/forecast").respond(json={"hourly": {}})
    with pytest.raises(UpstreamError):
        await OpenMeteoWeather(client, "https://meteo.test").hourly([A], "metric")


@respx.mock
async def test_photon_lang_only_when_supported(client: httpx.AsyncClient) -> None:
    mock = respx.get("https://photon.test/api").respond(json={"features": []})
    photon = PhotonGeocoding(client, "https://photon.test")
    await photon.search("tokyo", None, 3, "en-US")
    assert mock.calls.last.request.url.params["lang"] == "en"
    await photon.search("tokyo", None, 3, "ja-JP")
    assert "lang" not in mock.calls.last.request.url.params
