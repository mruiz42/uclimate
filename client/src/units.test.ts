import { describe, expect, it } from 'vitest';
import { compass, formatDistance, formatDuration } from './format';
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
