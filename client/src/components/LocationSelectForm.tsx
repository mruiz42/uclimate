import type { FormEvent } from 'react';
import { Alert, Button, Form, Spinner, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import type { LatLng, Place } from '../api/client';
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

export default LocationSelectForm;
