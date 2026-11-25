import { useStoredPref } from './prefs';

export type Units = 'metric' | 'imperial';

const STORAGE_KEY = 'uclimate.units';
// Countries that use °F and miles for everyday weather and road distances.
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

export function defaultUnits(locale: string = navigator.language): Units {
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return region && IMPERIAL_REGIONS.has(region) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

/** Units preference: the saved choice, else the browser locale's convention. */
export const useUnits = () =>
  useStoredPref<Units>(STORAGE_KEY, () => defaultUnits(), (raw) =>
    raw === 'metric' || raw === 'imperial' ? raw : null,
  );
