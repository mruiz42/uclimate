import { describe, expect, it } from 'vitest';
import { routeGradient } from './routeColors';
import { compass, condition, formatDistance, formatDistanceRange, formatDuration, toLocalInput } from './format';
import { defaultUnits } from './units';

describe('defaultUnits', () => {
  it.each([
    ['en-US', 'imperial'],
    ['en', 'imperial'], // maximizes to en-Latn-US
    ['es-US', 'imperial'],
    ['en-GB', 'metric'],
    ['de-DE', 'metric'],
    ['ja', 'metric'],
    ['not a locale!', 'metric'],
  ])('%s -> %s', (locale, expected) => {
    expect(defaultUnits(locale)).toBe(expected);
  });
});

describe('format', () => {
  it('formats distances in the chosen units', () => {
    expect(formatDistance(546_000, 'metric')).toBe('546 km');
    expect(formatDistance(546_000, 'imperial')).toBe('339 mi');
    expect(formatDistance(4_200, 'metric')).toBe('4.2 km');
  });

  it('formats durations', () => {
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(2 * 3600)).toBe('2 h');
    expect(formatDuration(6.4 * 3600)).toBe('6 h 24 min');
  });

  it('converts wind degrees to compass points', () => {
    expect(compass(0)).toBe('N');
    expect(compass(359)).toBe('N');
    expect(compass(315)).toBe('NW');
    expect(compass(-90)).toBe('W');
  });
});

describe('route colours', () => {
  const point = (distance_m: number, icon: string | null) => ({
    lat: 0,
    lng: 0,
    distance_m,
    eta: '2026-01-01T12:00:00Z',
    icon,
    severity: 0 as const,
  });

  it('maps weather icons to conditions', () => {
    expect(condition('clear')).toBe('dry');
    expect(condition('showers')).toBe('rain');
    expect(condition('thunderstorm')).toBe('storm');
    expect(condition(null)).toBe('unknown');
  });

  it('switches colour halfway between points with different conditions', () => {
    const gradient = routeGradient([point(0, 'clear'), point(10, 'cloudy'), point(20, 'rain'), point(40, 'rain')]);
    expect(gradient).toEqual(['step', ['line-progress'], '#0dcaf0', 0.375, '#1d4ed8']);
  });

  it('is a single band when conditions never change', () => {
    expect(routeGradient([point(0, 'snow'), point(10, 'snow')])).toEqual([
      'step',
      ['line-progress'],
      '#e0f2fe',
      1,
      '#e0f2fe',
    ]);
  });
});

describe('format helpers', () => {
  it('formats distance ranges', () => {
    expect(formatDistanceRange(250_000, 290_000, 'metric')).toBe('250–290 km');
    expect(formatDistanceRange(250_000, 250_000, 'metric')).toBe('250 km');
  });

  it('formats a local datetime-input value', () => {
    expect(toLocalInput(new Date(2026, 0, 5, 9, 3))).toBe('2026-01-05T09:03');
  });
});
