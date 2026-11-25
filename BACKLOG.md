# Backlog

Ideas not yet scheduled, roughly in priority order. Move an item to a GitHub issue when work starts.

## Official weather alerts along the route

Show government-issued warnings (winter storm, flood, high wind, etc.) next to the
forecast-based hazards.

- US: the [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
  is free and keyless (`/alerts/active?point=lat,lng`, or query by zone). It requires a
  `User-Agent` header.
- Other regions need their own sources (e.g. MeteoAlarm for Europe), so put this behind an
  `AlertsProvider` protocol in `backend/app/providers/base.py`.
- Check a subset of track points (alerts cover zones, so neighbouring points mostly return
  the same alert), dedupe by alert id, and only keep alerts active at each point's ETA.
- Client: show official alerts in the existing alert rows with a distinct badge, plus a
  link to the full text.

## Best time to leave

Suggest the departure window with the least bad weather.

- Reuse one forecast fetch for the dense track and score departures in steps (e.g. every
  1–2 h over the next 24–48 h) by re-running `weather_at` with shifted ETAs. No extra
  upstream calls are needed.
- Score: the sum of hazard severities along the track, weighted by stretch length. Show the
  top few windows, e.g. "Leave at 6 AM: no alerts".
- Possible endpoint: `GET /api/trip/departures?origin&destination&from&to&step_min`.
- Client: a small timeline/bar chart under the departure control; clicking a window sets
  the departure time.

## Shareable trip links

Encode the trip in the URL so a link reopens it.

- Query params: `from`, `to` (lat,lng plus label), `depart` (ISO), `every` (minutes),
  `units`.
- Read on load in `App.tsx` and plan automatically; update with `history.replaceState`
  when options change.
- Add a "Copy link" button. Show the URL as selectable text as a fallback when clipboard
  access is denied.

## Return trip (swap origin and destination)

- A ⇅ button between the two location fields in `LocationSelectForm.tsx`.
- Swaps the places and re-plans if a trip is already shown, keeping the departure and
  interval options.
