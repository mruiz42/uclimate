from collections.abc import Mapping
from typing import Any
from urllib.parse import urlencode

import httpx

from app.cache import Cache
from app.errors import UpstreamError

Params = Mapping[str, str | int | float]


async def get_json(
    client: httpx.AsyncClient,
    service: str,
    url: str,
    params: Params,
    *,
    cache: Cache | None = None,
    ttl_s: float = 0,
) -> Any:
    """GET a JSON document, with optional caching.

    Network errors, non-2xx responses and invalid JSON all raise `UpstreamError`;
    for 4xx responses the parsed body (if any) is attached so providers can inspect it.
    """
    key = f"{url}?{urlencode(sorted(params.items()))}"
    if cache is not None and (hit := cache.get(key)) is not None:
        return hit

    try:
        response = await client.get(url, params=dict(params))
    except httpx.HTTPError as exc:
        raise UpstreamError(service, f"request failed ({type(exc).__name__})") from exc

    try:
        body = response.json()
    except ValueError:
        body = None

    if response.is_error:
        raise UpstreamError(service, f"HTTP {response.status_code}", body)
    if body is None:
        raise UpstreamError(service, "response was not valid JSON")

    if cache is not None and ttl_s > 0:
        cache.set(key, body, ttl_s)
    return body
