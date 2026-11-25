import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.cache import MemoryCache
from app.config import Settings
from app.errors import NotFoundError, UpstreamError
from app.providers import build_providers
from app.providers.base import Providers
from app.routers import geocode, health, trip, weather

log = logging.getLogger("uclimate")


def create_app(settings: Settings | None = None, providers: Providers | None = None) -> FastAPI:
    """Build the API. Pass `providers` (e.g. fakes in tests) to skip creating real HTTP clients."""
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if providers is not None:
            app.state.providers = providers
            yield
        else:
            async with httpx.AsyncClient(
                timeout=settings.http_timeout_s,
                headers={"User-Agent": settings.user_agent},
                follow_redirects=True,
            ) as client:
                app.state.providers = build_providers(settings, client, MemoryCache())
                yield

    app = FastAPI(
        title="μClimate API",
        version="1.0.0",
        description="Driving routes with forecast weather at each stop. No API keys required.",
        lifespan=lifespan,
    )
    app.state.settings = settings

    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware, allow_origins=settings.cors_origin_list, allow_methods=["GET"]
        )

    @app.exception_handler(NotFoundError)
    async def not_found(_: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(UpstreamError)
    async def upstream(_: Request, exc: UpstreamError) -> JSONResponse:
        log.warning("upstream error: %s", exc)
        return JSONResponse(
            status_code=502,
            content={"detail": f"The {exc.service} service is unavailable. Try again shortly."},
        )

    for module in (trip, geocode, weather, health):
        app.include_router(module.router, prefix="/api")

    return app


app = create_app()
