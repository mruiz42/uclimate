"""Photon geocoding (OpenStreetMap data, built for search-as-you-type). https://photon.komoot.io"""

from typing import Any

import httpx

from app.cache import Cache
from app.http import get_json
from app.models import LatLng, Place

SERVICE = "photon"
GEOCODE_TTL_S = 24 * 60 * 60
# Languages the public Photon instance can label results in; others get local names.
SUPPORTED_LANGS = {"en", "de", "fr"}


def lang_param(lang: str | None) -> dict[str, str]:
    code = (lang or "").split("-")[0].lower()
    return {"lang": code} if code in SUPPORTED_LANGS else {}


class PhotonGeocoding:
    def __init__(self, client: httpx.AsyncClient, base_url: str, cache: Cache | None = None):
        self._client = client
        self._base = base_url.rstrip("/")
        self._cache = cache

    async def search(
        self, query: str, bias: LatLng | None, limit: int, lang: str | None = None
    ) -> list[Place]:
        params: dict[str, str | int | float] = {"q": query, "limit": limit, **lang_param(lang)}
        if bias is not None:
            # Rounded so nearby users share cache entries.
            params |= {"lat": round(bias.lat, 1), "lon": round(bias.lng, 1)}
        body = await get_json(
            self._client,
            SERVICE,
            f"{self._base}/api",
            params,
            cache=self._cache,
            ttl_s=GEOCODE_TTL_S,
        )
        return parse_features(body)

    async def reverse(self, point: LatLng, lang: str | None = None) -> Place | None:
        params: dict[str, str | int | float] = {
            "lat": round(point.lat, 5),
            "lon": round(point.lng, 5),
            "limit": 1,
            **lang_param(lang),
        }
        body = await get_json(
            self._client,
            SERVICE,
            f"{self._base}/reverse",
            params,
            cache=self._cache,
            ttl_s=GEOCODE_TTL_S,
        )
        places = parse_features(body)
        return places[0] if places else None


def parse_features(body: Any) -> list[Place]:
    places: list[Place] = []
    seen: set[str] = set()
    for feature in (body or {}).get("features", []):
        try:
            lng, lat = feature["geometry"]["coordinates"][:2]
        except (KeyError, TypeError, ValueError):
            continue
        props = feature.get("properties") or {}
        place = Place(
            id=f"{props.get('osm_type', '')}{props.get('osm_id', '')}" or f"{lat},{lng}",
            label=build_label(props) or f"{lat:.4f}, {lng:.4f}",
            lat=lat,
            lng=lng,
        )
        if place.id not in seen:
            seen.add(place.id)
            places.append(place)
    return places


def build_label(props: dict[str, Any]) -> str:
    """Human-readable label like "Ferry Building, San Francisco, California, United States"."""
    street = " ".join(p for p in (props.get("housenumber"), props.get("street")) if p)
    head = props.get("name") or street
    parts: list[str] = []
    for part in (
        head,
        props.get("city") or props.get("county"),
        props.get("state"),
        props.get("country"),
    ):
        if part and part not in parts:
            parts.append(part)
    return ", ".join(parts)
