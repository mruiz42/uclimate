# μClimate API

FastAPI service that plans a driving route and attaches the forecast weather for each stop along
it. It uses no API keys: routing comes from OSRM, place search from Photon, and weather from
Open-Meteo.

## Setup

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

```bash
uv sync                                           # create .venv and install dependencies
cp sample.env .env                                # optional: override defaults
uv run fastapi dev app/main.py --port 4200        # auto-reload dev server
```

Interactive docs are at <http://localhost:4200/docs>, and the OpenAPI schema is at `/openapi.json`.

## Commands

| Command                  | Purpose |
| ------------------------ | ------- |
| `uv run pytest`          | Tests (upstream services are mocked, so no network is needed) |
| `uv run ruff check`      | Lint |
| `uv run ruff format`     | Format |
| `uv run mypy app tests`  | Type-check (strict) |
| `uv run fastapi run app/main.py --port 4200` | Run without auto-reload |

## Endpoints

| Method and path               | Description |
| ----------------------------- | ----------- |
| `GET /api/trip`               | Route, weather stops, hazard alerts and a dense weather track. Query: `origin=lat,lng`, `destination=lat,lng`, `units=metric\|imperial`, optional `depart_at` (ISO 8601, defaults to now), `interval_min` (15–360, driving minutes between listed stops, default 60) |
| `GET /api/geocode/search`     | Place autocomplete. Query: `q`, optional `lat`/`lng` (bias), `limit`, `lang` |
| `GET /api/geocode/reverse`    | Nearest place to `lat`/`lng`, with optional `lang` |
| `GET /api/weather`            | Hourly forecast for one point. Query: `lat`, `lng`, `units`, `hours` |
| `GET /api/health`             | Liveness check |

Errors are returned as `{"detail": ...}` with these status codes:

- **404:** no drivable route, or nothing found nearby.
- **422:** invalid input.
- **502:** an upstream service failed.

## Configuration

All settings are read from environment variables or `.env`, in
[`app/config.py`](app/config.py). See [`sample.env`](sample.env) for the full list.

## Code layout

```text
app/
  main.py        app factory, lifespan (shared httpx client), error handlers
  config.py      settings (the only place config is read)
  models.py      API request/response models
  providers/     one module per external service, behind Protocols in base.py
  services/      pure logic: route sampling, stop picking, hazard detection, forecast-hour matching, trip assembly
  routers/       HTTP endpoints
tests/           pytest suite
```

To add a new external API, see "Adding another API" in the [root README](../README.md#adding-another-api).
