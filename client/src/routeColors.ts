import type { ExpressionSpecification } from 'maplibre-gl';
import type { TrackPoint } from './api/client';
import { CONDITIONS, condition } from './format';

/**
 * Colour bands along the route, switching halfway between track points whose conditions differ.
 * `line-progress` runs 0..1 along the line, which matches distance along the track.
 */
export function routeGradient(track: TrackPoint[]): ExpressionSpecification {
  const conditions = track.map((t) => condition(t.icon));
  const total = track[track.length - 1]?.distance_m ?? 0;
  const first = CONDITIONS[conditions[0] ?? 'dry'].color;
  const stops: (number | string)[] = [];
  let last = -1;
  for (let i = 1; i < track.length; i++) {
    if (conditions[i] === conditions[i - 1] || total <= 0) continue;
    const at = (track[i - 1].distance_m + track[i].distance_m) / 2 / total;
    if (at <= last) continue; // step inputs must strictly increase
    stops.push(at, CONDITIONS[conditions[i]].color);
    last = at;
  }
  if (stops.length === 0) stops.push(1, first);
  return ['step', ['line-progress'], first, ...stops] as ExpressionSpecification;
}
