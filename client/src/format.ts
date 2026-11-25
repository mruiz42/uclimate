import type { Units } from './units';

const ICONS: Record<string, string> = {
  clear: '☀️',
  'mostly-clear': '🌤️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  'freezing-rain': '🧊',
  snow: '🌨️',
  showers: '🌦️',
  thunderstorm: '⛈️',
};

export const weatherIcon = (icon: string): string => ICONS[icon] ?? '❔';

export function formatDistance(meters: number, units: Units): string {
  const value = units === 'imperial' ? meters / 1609.344 : meters / 1000;
  const unit = units === 'imperial' ? 'mi' : 'km';
  return `${value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString()} ${unit}`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Arrival time in the viewer's local time zone, e.g. "Tue 3:45 PM". */
export function formatTime(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Meteorological wind direction (where it blows from) as a compass point. */
export function compass(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

export const formatTemp = (t: number, unit: string): string => `${Math.round(t)}${unit}`;

const HAZARD_ICONS: Record<string, string> = {
  thunderstorm: '⛈️',
  snow: '🌨️',
  'freezing-rain': '🧊',
  'heavy-rain': '🌧️',
  fog: '🌫️',
  'high-wind': '💨',
  'temp-swing': '🌡️',
};

export const hazardIcon = (hazard: string): string => HAZARD_ICONS[hazard] ?? '⚠️';

/** "Tue 2:10 PM" or "Tue 2:10 PM – 2:40 PM" for a span (same day drops the weekday). */
export function formatTimeRange(startIso: string, endIso: string, locale?: string): string {
  const start = formatTime(startIso, locale);
  if (startIso === endIso) return start;
  const sameDay = new Date(startIso).toDateString() === new Date(endIso).toDateString();
  const end = sameDay
    ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(endIso))
    : formatTime(endIso, locale);
  return start === end ? start : `${start} – ${end}`;
}

/** "120 km" or "120–160 km" for a stretch of route. */
export function formatDistanceRange(startM: number, endM: number, units: Units): string {
  const start = formatDistance(startM, units);
  const end = formatDistance(endM, units);
  if (start === end) return start;
  return `${start.replace(/ \S+$/, '')}–${end}`;
}

/** Route-line colour per weather condition. */
export type Condition = 'dry' | 'rain' | 'snow' | 'freezing' | 'fog' | 'storm' | 'unknown';

export const CONDITIONS: Record<Condition, { label: string; color: string }> = {
  dry: { label: 'Dry', color: '#0dcaf0' },
  rain: { label: 'Rain', color: '#1d4ed8' },
  snow: { label: 'Snow', color: '#e0f2fe' },
  freezing: { label: 'Freezing rain', color: '#a855f7' },
  fog: { label: 'Fog', color: '#64748b' },
  storm: { label: 'Storms', color: '#dc3545' },
  unknown: { label: 'No forecast', color: '#ced4da' },
};

export function condition(icon: string | null | undefined): Condition {
  switch (icon) {
    case null:
    case undefined:
    case 'unknown':
      return 'unknown';
    case 'drizzle':
    case 'rain':
    case 'showers':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'freezing-rain':
      return 'freezing';
    case 'fog':
      return 'fog';
    case 'thunderstorm':
      return 'storm';
    default:
      return 'dry';
  }
}

/** `<input type="datetime-local">` value for a date, in the viewer's time zone. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
