import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Place, Trip } from './api/client';

// MapLibre needs WebGL, which jsdom doesn't have: render the map's children only.
vi.mock('react-map-gl/maplibre', () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
    default: forwardRef<unknown, { children?: ReactNode }>(({ children }, _ref) => <>{children}</>),
    Marker: Passthrough,
    Popup: Passthrough,
    Source: Passthrough,
    Layer: () => null,
    NavigationControl: () => null,
    AttributionControl: () => null,
  };
});

const { GET } = vi.hoisted(() => ({ GET: vi.fn() }));
vi.mock('./api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/client')>()),
  api: { GET },
}));

const SAN_JOSE: Place = { id: 'sj', label: 'San Jose, California, United States', lat: 37.34, lng: -121.89 };
const LA: Place = { id: 'la', label: 'Los Angeles, California, United States', lat: 34.05, lng: -118.24 };

const weather = (temperature: number, unit: string) => ({
  time: '2026-01-01T12:00:00Z',
  temperature,
  temperature_unit: unit,
  weather_code: 61,
  description: 'Light rain',
  icon: 'rain',
  wind_speed: 12,
  wind_speed_unit: unit === '°F' ? 'mph' : 'km/h',
  wind_direction: 315,
  precipitation_probability: 40,
});

const tripFor = (units: 'metric' | 'imperial'): Trip => {
  const unit = units === 'imperial' ? '°F' : '°C';
  return {
    units,
    depart_at: '2026-01-01T12:00:00Z',
    route: {
      distance_m: 546_000,
      duration_s: 6.4 * 3600,
      geometry: { type: 'LineString', coordinates: [[-121.89, 37.34], [-118.24, 34.05]] },
    },
    stops: [
      { lat: 37.34, lng: -121.89, distance_m: 0, eta_s: 0, eta: '2026-01-01T12:00:00Z', weather: weather(units === 'imperial' ? 55 : 13, unit) },
      { lat: 34.05, lng: -118.24, distance_m: 546_000, eta_s: 23_040, eta: '2026-01-01T18:24:00Z', weather: null },
    ],
    track: [
      { lat: 37.34, lng: -121.89, distance_m: 0, eta: '2026-01-01T12:00:00Z', icon: 'rain', severity: 0 },
      { lat: 35.7, lng: -120.1, distance_m: 273_000, eta: '2026-01-01T15:12:00Z', icon: 'thunderstorm', severity: 2 },
      { lat: 34.05, lng: -118.24, distance_m: 546_000, eta: '2026-01-01T18:24:00Z', icon: null, severity: 0 },
    ],
    alerts: [
      {
        hazard: 'thunderstorm',
        severity: 2,
        description: 'Thunderstorms',
        start_distance_m: 250_000,
        end_distance_m: 290_000,
        start_eta: '2026-01-01T15:00:00Z',
        end_eta: '2026-01-01T15:24:00Z',
        lat: 35.7,
        lng: -120.1,
      },
    ],
    interval_min: 60,
  };
};

function mockApi() {
  GET.mockImplementation(async (path: string, init: { params: { query: Record<string, string> } }) => {
    const query = init.params.query;
    if (path === '/api/geocode/search') {
      return { data: query.q.toLowerCase().startsWith('san') ? [SAN_JOSE] : [LA] };
    }
    if (path === '/api/trip') return { data: tripFor(query.units as 'metric' | 'imperial') };
    throw new Error(`unexpected ${path}`);
  });
}

async function pick(user: ReturnType<typeof userEvent.setup>, label: string, text: string, place: Place) {
  await user.type(screen.getByRole('combobox', { name: label }), text);
  await user.click(await screen.findByRole('option', { name: place.label }));
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    GET.mockReset();
    mockApi();
  });

  it('renders the trip form with Go disabled until both places are chosen', async () => {
    const user = userEvent.setup();
    render(<App />);
    const go = screen.getByRole('button', { name: 'Go' });
    expect(screen.getByRole('combobox', { name: 'Origin' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Destination' })).toBeInTheDocument();
    expect(go).toBeDisabled();

    await pick(user, 'Origin', 'San Jo', SAN_JOSE);
    expect(go).toBeDisabled();
    await pick(user, 'Destination', 'Los Ang', LA);
    expect(go).toBeEnabled();
  });

  it('searches with a debounce and passes the query to the API', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('combobox', { name: 'Origin' }), 'San Jose');
    await screen.findByRole('option', { name: SAN_JOSE.label });
    const searches = GET.mock.calls.filter(([path]) => path === '/api/geocode/search');
    expect(searches).toHaveLength(1); // one request for the whole burst of typing
    expect(searches[0][1].params.query.q).toBe('San Jose');
  });

  it('plans a trip and lists the weather at each stop', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /°C/ }));
    await pick(user, 'Origin', 'San', SAN_JOSE);
    await pick(user, 'Destination', 'Los', LA);
    await user.click(screen.getByRole('button', { name: 'Go' }));

    const panel = await screen.findByRole('region', { name: 'Weather along the route' });
    expect(within(panel).getByText('546 km · 6 h 24 min', { exact: false })).toBeInTheDocument();
    expect(within(panel).getByText('13°C')).toBeInTheDocument();
    expect(within(panel).getByText(/Light rain · wind 12 km\/h NW · 40% precip/)).toBeInTheDocument();
    expect(within(panel).getByText('Beyond forecast range')).toBeInTheDocument();
    expect(within(panel).getByText('⚠️ 1 weather alert on this route')).toBeInTheDocument();
    // The alert sits between the two stops, even though neither stop is in the storm.
    const rows = within(panel).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Start'),
      expect.stringContaining('Warning: Thunderstorms'),
      expect.stringContaining('Arrive'),
    ]);
    expect(rows[1]).toHaveTextContent('250–290 km');

    const tripCall = GET.mock.calls.find(([path]) => path === '/api/trip')!;
    expect(tripCall[1].params.query).toMatchObject({
      origin: '37.34,-121.89',
      destination: '34.05,-118.24',
      units: 'metric',
      interval_min: 60,
    });
    expect(tripCall[1].params.query).not.toHaveProperty('depart_at');
  });

  it('sends a chosen departure time and stop interval, and replans when they change', async () => {
    const user = userEvent.setup();
    render(<App />);
    await pick(user, 'Origin', 'San', SAN_JOSE);
    await pick(user, 'Destination', 'Los', LA);
    await user.selectOptions(screen.getByLabelText('Weather every'), '120');
    await user.click(screen.getByRole('radio', { name: 'Later' }));
    expect(screen.getByLabelText('Departure time')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await screen.findByRole('region', { name: 'Weather along the route' });

    const trips = () => GET.mock.calls.filter(([path]) => path === '/api/trip');
    const query = trips()[0][1].params.query;
    expect(query.interval_min).toBe(120);
    const depart = new Date(query.depart_at).getTime();
    expect(depart).toBeGreaterThan(Date.now());
    expect(depart % 3600_000).toBe(0); // "Later" starts at the next full hour
    expect(localStorage.getItem('uclimate.interval')).toBe('120');

    await user.selectOptions(screen.getByLabelText('Weather every'), '30');
    await waitFor(() => expect(trips()).toHaveLength(2));
    expect(trips()[1][1].params.query.interval_min).toBe(30);

    await user.click(screen.getByRole('radio', { name: 'Now' }));
    await waitFor(() => expect(trips()).toHaveLength(3));
    expect(trips()[2][1].params.query).not.toHaveProperty('depart_at');
    expect(screen.queryByLabelText('Departure time')).not.toBeInTheDocument();
  });

  it('switching units refetches the trip and remembers the choice', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /°C/ }));
    await pick(user, 'Origin', 'San', SAN_JOSE);
    await pick(user, 'Destination', 'Los', LA);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await screen.findByText('13°C');

    await user.click(screen.getByRole('radio', { name: /°F/ }));
    expect(await screen.findAllByText('55°F')).not.toHaveLength(0);
    expect(localStorage.getItem('uclimate.units')).toBe('imperial');
  });

  it('shows the server error message when a trip fails', async () => {
    GET.mockImplementation(async (path: string, init: { params: { query: Record<string, string> } }) => {
      if (path === '/api/geocode/search') {
        return { data: init.params.query.q.startsWith('San') ? [SAN_JOSE] : [LA] };
      }
      return { data: undefined, error: { detail: 'No drivable route between these places' } };
    });
    const user = userEvent.setup();
    render(<App />);
    await pick(user, 'Origin', 'San', SAN_JOSE);
    await pick(user, 'Destination', 'Los', LA);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No drivable route between these places'),
    );
  });
});
