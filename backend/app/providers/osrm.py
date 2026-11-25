"""OSRM routing. https://project-osrm.org/docs/v5.24.0/api/#route-service"""

from typing import Any

import httpx

from app.cache import Cache
from app.errors import NotFoundError, UpstreamError
from app.http import get_json
from app.models import LatLng
from app.providers.base import RouteResult

SERVICE = "osrm"
ROUTE_TTL_S = 60 * 60
NO_RESULT_CODES = {"NoRoute", "NoSegment"}


class OsrmRouting:
    def __init__(self, client: httpx.AsyncClient, base_url: str, cache: Cache | None = None):
        self._client = client
        self._base = base_url.rstrip("/")
        self._cache = cache

    async def route(self, origin: LatLng, destination: LatLng) -> RouteResult:
        coords = f"{origin.lng},{origin.lat};{destination.lng},{destination.lat}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "annotations": "duration",
            "steps": "false",
        }
        try:
            body = await get_json(
                self._client,
                SERVICE,
                f"{self._base}/route/v1/driving/{coords}",
                params,
                cache=self._cache,
                ttl_s=ROUTE_TTL_S,
            )
        except UpstreamError as exc:
            if isinstance(exc.body, dict) and exc.body.get("code") in NO_RESULT_CODES:
                raise NotFoundError("No drivable route between these places") from exc
            raise
        return parse_route(body)


def parse_route(body: Any) -> RouteResult:
    code = body.get("code") if isinstance(body, dict) else None
    if code in NO_RESULT_CODES or (code == "Ok" and not body.get("routes")):
        raise NotFoundError("No drivable route between these places")
    if code != "Ok":
        raise UpstreamError(SERVICE, f"unexpected response code {code!r}")

    route = body["routes"][0]
    coordinates = [(float(c[0]), float(c[1])) for c in route["geometry"]["coordinates"]]

    legs = route.get("legs") or []
    per_leg: list[list[float] | None] = [
        (leg.get("annotation") or {}).get("duration") for leg in legs
    ]
    durations: list[float] | None = []
    for leg_durations in per_leg:
        if leg_durations is None or durations is None:
            durations = None
            continue
        durations.extend(float(d) for d in leg_durations)

    return RouteResult(
        coordinates=coordinates,
        distance_m=float(route["distance"]),
        duration_s=float(route["duration"]),
        segment_durations_s=durations,
    )
