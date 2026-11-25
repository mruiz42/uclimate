import { useCallback, useState } from 'react';

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

function readStored(): Units | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'metric' || value === 'imperial' ? value : null;
  } catch {
    return null;
  }
}

/** Units preference: the saved choice, else the browser locale's convention. */
export function useUnits(): [Units, (units: Units) => void] {
  const [units, setUnitsState] = useState<Units>(() => readStored() ?? defaultUnits());
  const setUnits = useCallback((next: Units) => {
    setUnitsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist.
    }
  }, []);
  return [units, setUnits];
}
