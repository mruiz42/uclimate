import type { Trip } from '../api/client';
import { compass, formatDistance, formatDuration, formatTemp, formatTime, weatherIcon } from '../format';
import type { Units } from '../units';
import style from './style/WeatherPanel.module.scss';

type Props = {
  trip: Trip;
  units: Units;
  selected: number | null;
  onSelect: (index: number) => void;
};

/** Trip summary plus the forecast at each stop, in driving order. */
const WeatherPanel = ({ trip, units, selected, onSelect }: Props) => {
  const last = trip.stops[trip.stops.length - 1];
  return (
    <section className={style.panel} aria-label="Weather along the route">
      <p className={style.summary}>
        {formatDistance(trip.route.distance_m, units)} · {formatDuration(trip.route.duration_s)}
        {last && <> · arrive {formatTime(last.eta)}</>}
      </p>
      <ol className={style.stops}>
        {trip.stops.map((stop, i) => {
          const w = stop.weather;
          const place = i === 0 ? 'Start' : i === trip.stops.length - 1 ? 'Arrive' : null;
          return (
            <li key={`${stop.lat},${stop.lng}`}>
              <button
                type="button"
                className={`${style.stop} ${i === selected ? style.selected : ''}`}
                onClick={() => onSelect(i)}
                aria-pressed={i === selected}
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
                      {w.precipitation_probability != null &&
                        ` · ${Math.round(w.precipitation_probability)}% precip`}
                    </span>
                  ) : (
                    <span className={style.details}>Beyond forecast range</span>
                  )}
                </span>
                {w && <span className={style.temp}>{formatTemp(w.temperature, w.temperature_unit)}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default WeatherPanel;
