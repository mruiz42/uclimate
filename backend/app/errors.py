from typing import Any


class UpstreamError(Exception):
    """An external service failed or returned something unusable (-> HTTP 502)."""

    def __init__(self, service: str, message: str, body: Any = None) -> None:
        super().__init__(f"{service}: {message}")
        self.service = service
        self.body = body


class NotFoundError(Exception):
    """The request was valid but there is no result, e.g. no drivable route (-> HTTP 404)."""
