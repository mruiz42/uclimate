import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage, type LatLng, type Place, type Trip } from './api/client';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import style from './style/App.module.scss';
import { useUnits, type Units } from './units';

const App = () => {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [units, setUnits] = useUnits();
  const pending = useRef<AbortController | null>(null);

  const planTrip = useCallback(async (from: Place, to: Place, u: Units) => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.GET('/api/trip', {
        params: {
          query: { origin: `${from.lat},${from.lng}`, destination: `${to.lat},${to.lng}`, units: u },
        },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (data) {
        setTrip(data);
        setSelected(null);
      } else {
        setError(errorMessage(apiError, 'Could not plan this trip.'));
      }
    } catch {
      if (!controller.signal.aborted) setError('Could not reach the μClimate server.');
    } finally {
      if (pending.current === controller) setLoading(false);
    }
  }, []);

  // A shown trip no longer matches once either end changes.
  const resetTrip = useCallback(() => {
    pending.current?.abort();
    setTrip(null);
    setSelected(null);
  }, []);
  const changeOrigin = useCallback(
    (place: Place | null) => {
      setOrigin(place);
      resetTrip();
    },
    [resetTrip],
  );
  const changeDestination = useCallback(
    (place: Place | null) => {
      setDestination(place);
      resetTrip();
    },
    [resetTrip],
  );

  const changeUnits = (u: Units) => {
    setUnits(u);
    // Forecast values come back in the requested units, so refresh a trip already shown.
    if (trip && origin && destination) void planTrip(origin, destination, u);
  };

  const locateUser = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const here = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(here);
        const { data } = await api
          .GET('/api/geocode/reverse', { params: { query: { ...here, lang: navigator.language } } })
          .catch(() => ({ data: undefined }));
        changeOrigin(data ?? { id: 'my-location', label: 'My location', ...here });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Could not get your location. Search for a starting point instead.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [changeOrigin]);

  useEffect(() => () => pending.current?.abort(), []);

  return (
    <div className={style.app}>
      <Sidebar
        origin={origin}
        destination={destination}
        onOriginChange={changeOrigin}
        onDestinationChange={changeDestination}
        onUseMyLocation={locateUser}
        locating={locating}
        bias={userLocation ?? origin}
        units={units}
        onUnitsChange={changeUnits}
        onSubmit={() => origin && destination && planTrip(origin, destination, units)}
        loading={loading}
        error={error}
        trip={trip}
        selected={selected}
        onSelectStop={setSelected}
      />
      <main className={style.mapArea}>
        <MapView
          origin={origin}
          destination={destination}
          trip={trip}
          units={units}
          selected={selected}
          onSelect={setSelected}
        />
      </main>
    </div>
  );
};

export default App;
