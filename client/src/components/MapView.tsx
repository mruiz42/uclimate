import { useEffect, useMemo, useRef } from 'react';
import Map, {
  AttributionControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type LineLayer,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Place, Trip } from '../api/client';
import {
  CONDITIONS,
  compass,
  condition,
  formatDistance,
  formatDistanceRange,
  formatTemp,
  formatTime,
  formatTimeRange,
  hazardIcon,
  weatherIcon,
  type Condition,
} from '../format';
import { routeGradient } from '../routeColors';
import { isSelected, type Selection } from '../selection';
import type { Units } from '../units';
import style from './style/MapView.module.scss';

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

// The base style credits OpenFreeMap / OpenMapTiles / OpenStreetMap; these cover the APIs.
const ATTRIBUTION = [
  '<a href="https://project-osrm.org/" target="_blank" rel="noreferrer">OSRM</a>',
  '<a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a>',
  '<a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a>',
];

const routeCasing: LineLayer = {
  id: 'route-casing',
  type: 'line',
  source: 'route',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#0b5d75', 'line-width': 8 },
};
const routeLine = (gradient: ExpressionSpecification): LineLayer => ({
  id: 'route-line',
  type: 'line',
  source: 'route',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-gradient': gradient, 'line-width': 5 },
});


type Props = {
  origin: Place | null;
  destination: Place | null;
  trip: Trip | null;
  units: Units;
  selected: Selection;
  onSelect: (selection: Selection) => void;
};

const MapView = ({ origin, destination, trip, units, selected, onSelect }: Props) => {
  const mapRef = useRef<MapRef>(null);

  const route = useMemo(
    () =>
      trip && {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: trip.route.geometry.coordinates },
      },
    [trip],
  );

  // Frame the whole route when a trip loads; otherwise follow the chosen places.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = trip
      ? trip.route.geometry.coordinates
      : [origin, destination].flatMap((p) => (p ? [[p.lng, p.lat] as [number, number]] : []));
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 10, duration: 800 });
      return;
    }
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      // Extra room at the bottom keeps the route clear of the legend.
      { padding: { top: 60, right: 60, bottom: 90, left: 60 }, duration: 800, maxZoom: 12 },
    );
  }, [trip, origin, destination]);

  const gradient = useMemo(() => trip && routeGradient(trip.track), [trip]);
  const legend = useMemo(
    () => (trip ? [...new Set(trip.track.map((t) => condition(t.icon)))] : []) as Condition[],
    [trip],
  );

  const selectedStop = selected?.kind === 'stop' ? trip?.stops[selected.index] : undefined;
  const selectedAlert = selected?.kind === 'alert' ? trip?.alerts[selected.index] : undefined;
  const focus = selectedStop ?? selectedAlert;
  const lastIndex = trip ? trip.stops.length - 1 : -1;

  // Pan to a stop or alert picked from the side panel.
  useEffect(() => {
    if (focus) mapRef.current?.easeTo({ center: [focus.lng, focus.lat], duration: 500 });
  }, [focus]);

  return (
    <div className={style.map}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: 0, latitude: 25, zoom: 1.5 }}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <AttributionControl position="bottom-right" compact customAttribution={ATTRIBUTION} />

        {route && gradient && (
          <Source id="route" type="geojson" data={route} lineMetrics>
            <Layer {...routeCasing} />
            <Layer {...routeLine(gradient)} />
          </Source>
        )}

        {!trip &&
          [origin, destination].map(
            (place, i) =>
              place && (
                <Marker key={i} longitude={place.lng} latitude={place.lat} anchor="center">
                  <span className={`${style.pin} ${i === 0 ? style.origin : style.destination}`}>
                    {i === 0 ? 'A' : 'B'}
                  </span>
                </Marker>
              ),
          )}

        {trip?.stops.map((stop, i) => (
          <Marker
            key={`${stop.lat},${stop.lng}`}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect({ kind: 'stop', index: i });
            }}
          >
            <span
              className={[
                style.stop,
                i === 0 && style.origin,
                i === lastIndex && style.destination,
                isSelected(selected, 'stop', i) && style.selected,
              ]
                .filter(Boolean)
                .join(' ')}
              title={stop.weather?.description ?? 'Beyond forecast range'}
            >
              {stop.weather
                ? `${weatherIcon(stop.weather.icon)} ${formatTemp(stop.weather.temperature, '°')}`
                : '–'}
            </span>
          </Marker>
        ))}

        {trip?.alerts.map((alert, i) => (
          <Marker
            key={`alert-${i}`}
            longitude={alert.lng}
            latitude={alert.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect({ kind: 'alert', index: i });
            }}
          >
            <span
              className={[
                style.alertPin,
                alert.severity === 2 ? style.warning : style.caution,
                isSelected(selected, 'alert', i) && style.selected,
              ]
                .filter(Boolean)
                .join(' ')}
              title={alert.description}
            >
              {hazardIcon(alert.hazard)}
            </span>
          </Marker>
        ))}

        {selectedAlert && (
          <Popup
            longitude={selectedAlert.lng}
            latitude={selectedAlert.lat}
            anchor="bottom"
            offset={18}
            closeOnClick={false}
            onClose={() => onSelect(null)}
            className={style.popup}
          >
            <strong>
              {hazardIcon(selectedAlert.hazard)} {selectedAlert.description}
            </strong>
            <div>{formatDistanceRange(selectedAlert.start_distance_m, selectedAlert.end_distance_m, units)}</div>
            <div>{formatTimeRange(selectedAlert.start_eta, selectedAlert.end_eta)}</div>
          </Popup>
        )}

        {selectedStop && (
          <Popup
            longitude={selectedStop.lng}
            latitude={selectedStop.lat}
            anchor="bottom"
            offset={18}
            closeOnClick={false}
            onClose={() => onSelect(null)}
            className={style.popup}
          >
            <strong>
              {formatTime(selectedStop.eta)} · {formatDistance(selectedStop.distance_m, units)}
            </strong>
            {selectedStop.weather ? (
              <>
                <div>
                  {weatherIcon(selectedStop.weather.icon)} {selectedStop.weather.description},{' '}
                  {formatTemp(selectedStop.weather.temperature, selectedStop.weather.temperature_unit)}
                </div>
                <div>
                  Wind {Math.round(selectedStop.weather.wind_speed)} {selectedStop.weather.wind_speed_unit}
                  {selectedStop.weather.wind_direction != null &&
                    ` from ${compass(selectedStop.weather.wind_direction)}`}
                </div>
                {selectedStop.weather.precipitation_probability != null && (
                  <div>Precipitation {Math.round(selectedStop.weather.precipitation_probability)}%</div>
                )}
              </>
            ) : (
              <div>Arrival is beyond the forecast range.</div>
            )}
          </Popup>
        )}
      </Map>
      {legend.length > 0 && (
        <ul className={style.legend} aria-label="Route colors">
          {legend.map((c) => (
            <li key={c}>
              <span className={style.swatch} style={{ background: CONDITIONS[c].color }} aria-hidden />
              {CONDITIONS[c].label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MapView;
