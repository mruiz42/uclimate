# μClimate web app

React 18 + TypeScript app, built with Vite. The map uses MapLibre GL with OpenFreeMap tiles, and
all data comes from the [μClimate API](../backend/README.md).

## Setup

```bash
npm install
npm run dev        # http://localhost:5173 (expects the API on :4200)
```

In development, Vite proxies `/api` to `http://localhost:4200`, so no CORS setup is needed. To run
both halves together, use `npm run dev` from the repo root.

## Scripts

| Command             | Purpose |
| ------------------- | ------- |
| `npm run dev`       | Dev server with hot reload |
| `npm test`          | Vitest suite (the map and API are mocked) |
| `npm run typecheck` | TypeScript check |
| `npm run build`     | Type-check and production build to `dist/` |
| `npm run preview`   | Serve the production build locally |
| `npm run gen:api`   | Regenerate `src/api/schema.d.ts` from the running API's OpenAPI schema |

## API types

[`src/api/schema.d.ts`](src/api/schema.d.ts) is generated from the backend's OpenAPI schema and
committed, so the app builds without the API running. After changing backend models or routes,
start the API and run `npm run gen:api`. `src/api/client.ts` wraps it in a typed
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) client.

## Configuration

Both variables are optional. Set them in `.env.local` (see [`sample.env`](sample.env)).

| Variable         | Default               | Purpose |
| ---------------- | --------------------- | ------- |
| `VITE_API_URL`   | same origin           | Where the API lives, when it isn't served under `/api` on the same origin |
| `VITE_MAP_STYLE` | OpenFreeMap "liberty" | Any MapLibre style URL |

## Code layout

```text
src/
  App.tsx                  state and data flow (places, trip options, trip, selection)
  api/                     generated schema + typed client
  components/
    LocationFormText.tsx   search-as-you-type place picker
    LocationSelectForm.tsx origin/destination form, departure, interval, units, Go
    MapView.tsx            MapLibre map: weather-colored route, stop and alert markers, legend
    WeatherPanel.tsx       trip summary, alert banner, stops and alerts in driving order
    Sidebar.tsx            layout wrapper
  format.ts                distance/time/wind formatting, weather and hazard icons, route palette
  routeColors.ts           route line gradient built from the weather track
  prefs.ts                 saved preferences (localStorage), stop-interval options
  selection.ts             selected stop or alert
  units.ts                 locale-based default units + saved preference
```
