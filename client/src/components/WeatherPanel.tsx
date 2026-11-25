import type { Alert, Stop, Trip } from '../api/client';
import {
  compass,
  formatDistance,
  formatDistanceRange,
  formatDuration,
  formatTemp,
  formatTime,
  formatTimeRange,
  hazardIcon,
  weatherIcon,
} from '../format';
import { isSelected, type Selection } from '../selection';
import type { Units } from '../units';
import style from './style/WeatherPanel.module.scss';

type Props = {
  trip: Trip;
  units: Units;
  selected: Selection;
  onSelect: (selection: Selection) => void;
};

type Row = { kind: 'stop'; index: number; stop: Stop } | { kind: 'alert'; index: number; alert: Alert };

/** Stops and alerts in driving order; an alert sits just after the stop before it starts. */
function rows(trip: Trip): Row[] {
  const all: (Row & { at: number; order: number })[] = [
    ...trip.stops.map((stop, index) => ({ kind: 'stop' as const, index, stop, at: stop.distance_m, order: 0 })),
    ...trip.alerts.map((alert, index) => ({
      kind: 'alert' as const,
      index,
      alert,
      at: alert.start_distance_m,
      order: 1,
    })),
  ];
  return all.sort((a, b) => a.at - b.at || a.order - b.order);
}

/** Trip summary, hazard alerts, and the forecast at each listed stop, in driving order. */
const WeatherPanel = ({ trip, units, selected, onSelect }: Props) => {
  const last = trip.stops[trip.stops.length - 1];
  const hasForecast = trip.track.some((t) => t.icon != null);
  const warnings = trip.alerts.filter((a) => a.severity === 2).length;
  return (
    <section className={style.panel} aria-label="Weather along the route">
      <p className={style.summary}>
        {formatDistance(trip.route.distance_m, units)} · {formatDuration(trip.route.duration_s)}
        {' · '}leave {formatTime(trip.depart_at)}
        {last && <> · arrive {formatTime(last.eta)}</>}
      </p>
      {hasForecast && (
        <p
          className={`${style.banner} ${warnings ? style.warning : trip.alerts.length ? style.caution : style.clear}`}
        >
          {trip.alerts.length === 0
            ? '✓ No hazardous weather found along the route'
            : `⚠️ ${trip.alerts.length} weather ${trip.alerts.length === 1 ? 'alert' : 'alerts'} on this route`}
        </p>
      )}
      <ol className={style.stops}>
        {rows(trip).map((row) =>
          row.kind === 'alert' ? (
            <li key={`alert-${row.index}`}>
              <AlertRow
                alert={row.alert}
                units={units}
                selected={isSelected(selected, 'alert', row.index)}
                onClick={() => onSelect({ kind: 'alert', index: row.index })}
              />
            </li>
          ) : (
            <li key={`${row.stop.lat},${row.stop.lng}`}>
              <StopRow
                stop={row.stop}
                units={units}
                place={row.index === 0 ? 'Start' : row.index === trip.stops.length - 1 ? 'Arrive' : null}
                selected={isSelected(selected, 'stop', row.index)}
                onClick={() => onSelect({ kind: 'stop', index: row.index })}
              />
            </li>
          ),
        )}
      </ol>
    </section>
  );
};

type RowProps = { units: Units; selected: boolean; onClick: () => void };

const StopRow = ({ stop, units, place, selected, onClick }: RowProps & { stop: Stop; place: string | null }) => {
  const w = stop.weather;
  return (
    <button
      type="button"
      className={`${style.stop} ${selected ? style.selected : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={style.icon} aria-hidden>
        {w ? weatherIcon(w.icon) : '·'}
      </span>
      <span className={style.body}>
        <span className={style.when}>
          {place ?? formatDistance(stop.distance_m, units)} · {formatTime(stop.eta)}
        </span>
        {w ? (
          <span className={style.details}>
            {w.description}
            {' · '}
            wind {Math.round(w.wind_speed)} {w.wind_speed_unit}
            {w.wind_direction != null && ` ${compass(w.wind_direction)}`}
            {w.precipitation_probability != null && ` · ${Math.round(w.precipitation_probability)}% precip`}
          </span>
        ) : (
          <span className={style.details}>Beyond forecast range</span>
        )}
      </span>
      {w && <span className={style.temp}>{formatTemp(w.temperature, w.temperature_unit)}</span>}
    </button>
  );
};

const AlertRow = ({ alert, units, selected, onClick }: RowProps & { alert: Alert }) => (
  <button
    type="button"
    className={[
      style.stop,
      style.alert,
      alert.severity === 2 ? style.warning : style.caution,
      selected && style.selected,
    ]
      .filter(Boolean)
      .join(' ')}
    onClick={onClick}
    aria-pressed={selected}
  >
    <span className={style.icon} aria-hidden>
      {hazardIcon(alert.hazard)}
    </span>
    <span className={style.body}>
      <span className={style.when}>
        {alert.severity === 2 ? 'Warning' : 'Caution'}: {alert.description}
      </span>
      <span className={style.details}>
        {formatDistanceRange(alert.start_distance_m, alert.end_distance_m, units)} ·{' '}
        {formatTimeRange(alert.start_eta, alert.end_eta)}
      </span>
    </span>
  </button>
);

export default WeatherPanel;
