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
