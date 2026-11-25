import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

/** Typed client generated from the backend's OpenAPI schema (`npm run gen:api`). */
export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL ?? '' });

type Schemas = components['schemas'];
export type Place = Schemas['Place'];
export type Trip = Schemas['Trip'];
export type Stop = Schemas['Stop'];
export type Weather = Schemas['Weather'];
export type Alert = Schemas['Alert'];
export type TrackPoint = Schemas['TrackPoint'];
export type LatLng = { lat: number; lng: number };

/** Turn an API error body (FastAPI's `{detail}`) into something to show the user. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return 'Please check the locations and try again.';
  return fallback;
}
