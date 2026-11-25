from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.deps import ProvidersDep
from app.models import LatLng, Place

router = APIRouter(prefix="/geocode", tags=["geocode"])

Lat = Annotated[float, Query(ge=-90, le=90)]
Lng = Annotated[float, Query(ge=-180, le=180)]
Lang = Annotated[
    str | None,
    Query(max_length=35, description="Preferred label language (BCP 47), e.g. 'en-US'"),
]


@router.get("/search", response_model=list[Place], summary="Search places (autocomplete)")
async def search(
    providers: ProvidersDep,
    q: Annotated[str, Query(min_length=2, max_length=200)],
    lat: Lat | None = None,
    lng: Lng | None = None,
    limit: Annotated[int, Query(ge=1, le=10)] = 6,
    lang: Lang = None,
) -> list[Place]:
    bias = LatLng(lat=lat, lng=lng) if lat is not None and lng is not None else None
    return await providers.geocoding.search(q.strip(), bias, limit, lang)


@router.get(
    "/reverse",
    response_model=Place,
    summary="Nearest place to a coordinate",
    responses={404: {"description": "Nothing found nearby"}},
)
async def reverse(providers: ProvidersDep, lat: Lat, lng: Lng, lang: Lang = None) -> Place:
    place = await providers.geocoding.reverse(LatLng(lat=lat, lng=lng), lang)
    if place is None:
        raise HTTPException(404, "No place found near this point")
    return place
