import { useCallback, useState } from 'react';

function readStored<T>(key: string, parse: (raw: string) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : parse(raw);
  } catch {
    return null;
  }
}

/** A preference kept in localStorage: the saved value if valid, else `fallback()`. */
export function useStoredPref<T>(
  key: string,
  fallback: () => T,
  parse: (raw: string) => T | null,
): [T, (value: T) => void] {
  const [value, setValueState] = useState<T>(() => readStored(key, parse) ?? fallback());
  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Storage unavailable (private mode etc.): the choice just won't persist.
      }
    },
    [key],
  );
  return [value, setValue];
}

/** Driving minutes between the stops listed for a trip. */
export const INTERVAL_OPTIONS = [30, 60, 120, 180] as const;
export const DEFAULT_INTERVAL_MIN = 60;

export const useIntervalMin = () =>
  useStoredPref<number>(
    'uclimate.interval',
    () => DEFAULT_INTERVAL_MIN,
    (raw) => (INTERVAL_OPTIONS.some((o) => String(o) === raw) ? Number(raw) : null),
  );
