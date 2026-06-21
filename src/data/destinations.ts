import type { Destination } from '../types';

export const DESTINATIONS: readonly Destination[] = [
  { id: 'park', label: '公園', icon: '🌳' },
  { id: 'theme_park', label: 'テーマパーク', icon: '🎢' },
  { id: 'indoor', label: '屋内施設', icon: '🏬' },
  { id: 'seaside', label: '海・水辺', icon: '🏖️' },
  { id: 'outdoor', label: 'アウトドア', icon: '⛰️' },
] as const;

export const DESTINATION_MAP: Readonly<Record<string, Destination>> = Object.freeze(
  Object.fromEntries(DESTINATIONS.map((d) => [d.id, d])),
);

export function destinationLabel(id: string): string {
  return DESTINATION_MAP[id]?.label ?? id;
}
