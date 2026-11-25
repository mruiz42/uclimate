import { useState, type FormEvent } from 'react';
import { Alert, Button, Form, Spinner, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import type { LatLng, Place } from '../api/client';
import { toLocalInput } from '../format';
import { INTERVAL_OPTIONS } from '../prefs';
import type { Units } from '../units';
import LocationFormText from './LocationFormText';
import style from './style/LocationSelectForm.module.scss';

type Props = {
  origin: Place | null;
  destination: Place | null;
  onOriginChange: (place: Place | null) => void;
  onDestinationChange: (place: Place | null) => void;
  onUseMyLocation: () => void;
  locating: boolean;
  bias: LatLng | null;
  units: Units;
  onUnitsChange: (units: Units) => void;
  departAt: Date | null;
  onDepartAtChange: (departAt: Date | null) => void;
  intervalMin: number;
  onIntervalMinChange: (minutes: number) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
};

const LocationSelectForm = (props: Props) => {
  const { origin, destination, units, loading, error } = props;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (origin && destination && !loading) props.onSubmit();
  };

  return (
    <Form onSubmit={submit} className={style.form}>
      <LocationFormText
        label="Origin"
        value={origin}
        onSelect={props.onOriginChange}
        bias={props.bias}
        placeholder="Where are you starting?"
      >
        <button
          type="button"
          className={style.linkButton}
          onClick={props.onUseMyLocation}
          disabled={props.locating}
        >
          {props.locating ? 'Locating…' : 'Use my location'}
        </button>
      </LocationFormText>
      <LocationFormText
        label="Destination"
        value={destination}
        onSelect={props.onDestinationChange}
        bias={props.bias}
        placeholder="Where are you going?"
      />

      <div className={style.options}>
        <Departure value={props.departAt} onChange={props.onDepartAtChange} />
        <Form.Group controlId="interval" className={style.option}>
          <Form.Label className={style.optionLabel}>Weather every</Form.Label>
          <Form.Select
            size="sm"
            value={props.intervalMin}
            onChange={(e) => props.onIntervalMinChange(Number(e.target.value))}
          >
            {INTERVAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`} of driving
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      <div className={style.actions}>
        <ToggleButtonGroup
          type="radio"
          name="units"
          value={units}
          onChange={(value: Units) => props.onUnitsChange(value)}
          aria-label="Units"
        >
          <ToggleButton id="units-metric" value="metric" variant="outline-light" size="sm">
            °C · km
          </ToggleButton>
          <ToggleButton id="units-imperial" value="imperial" variant="outline-light" size="sm">
            °F · mi
          </ToggleButton>
        </ToggleButtonGroup>
        <Button type="submit" variant="info" disabled={!origin || !destination || loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" aria-hidden />
              Planning…
            </>
          ) : (
            'Go'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className={style.error}>
          {error}
        </Alert>
      )}
    </Form>
  );
};

const HOUR_MS = 3600_000;
// Open-Meteo forecasts reach about a week with useful skill (16 days at most).
const MAX_AHEAD_MS = 7 * 24 * HOUR_MS;

/** Leave now, or at a chosen local date and time within the forecast range. */
const Departure = ({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (departAt: Date | null) => void;
}) => {
  // The input's own text, so half-typed dates don't replan the trip.
  const [draft, setDraft] = useState(() => (value ? toLocalInput(value) : ''));
  const now = Date.now();
  const min = toLocalInput(new Date(now));
  const max = toLocalInput(new Date(now + MAX_AHEAD_MS));

  const chooseLater = () => {
    const nextHour = new Date(Math.ceil((now + 1) / HOUR_MS) * HOUR_MS);
    setDraft(toLocalInput(nextHour));
    onChange(nextHour);
  };
  const edit = (text: string) => {
    setDraft(text);
    const date = new Date(text);
    const t = date.getTime();
    // Allow a little slack for the minute that passed while choosing.
    if (!Number.isNaN(t) && t >= now - 5 * 60_000 && t <= now + MAX_AHEAD_MS) onChange(date);
  };

  return (
    <Form.Group className={style.option}>
      <span className={style.optionLabel} id="depart-label">
        Depart
      </span>
      <ToggleButtonGroup
        type="radio"
        name="depart"
        value={value ? 'later' : 'now'}
        onChange={(v: string) => (v === 'now' ? onChange(null) : chooseLater())}
        aria-labelledby="depart-label"
      >
        <ToggleButton id="depart-now" value="now" variant="outline-light" size="sm">
          Now
        </ToggleButton>
        <ToggleButton id="depart-later" value="later" variant="outline-light" size="sm">
          Later
        </ToggleButton>
      </ToggleButtonGroup>
      {value && (
        <Form.Control
          type="datetime-local"
          size="sm"
          className={style.when}
          aria-label="Departure time"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => edit(e.target.value)}
        />
      )}
    </Form.Group>
  );
};

export default LocationSelectForm;
