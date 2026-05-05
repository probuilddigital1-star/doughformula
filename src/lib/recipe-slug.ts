import type { Combo, Style, Hydration, Schedule } from '../data/recipes';
import { STYLES, HYDRATIONS, SCHEDULES } from '../data/recipes';

export function comboToSlug(c: Combo): string {
  return `${c.style}-${c.hydration}-${c.schedule}`;
}

export function slugToCombo(slug: string): Combo | null {
  // Style strings can contain hyphens (e.g. "no-knead", "country-loaf").
  // Schedule strings can contain hyphens (e.g. "same-day").
  // Strategy: greedy-match styles longest-first, then expect a 2-digit hydration, then schedule.
  const stylesByLength = [...STYLES].sort((a, b) => b.length - a.length);
  for (const style of stylesByLength) {
    if (slug.startsWith(style + '-')) {
      const rest = slug.slice(style.length + 1);
      // rest is "<hydration>-<schedule>"
      const match = rest.match(/^(\d{2,3})-(.+)$/);
      if (!match) continue;
      const hyd = Number(match[1]);
      const sched = match[2];
      if (
        (HYDRATIONS as readonly number[]).includes(hyd) &&
        (SCHEDULES as readonly string[]).includes(sched)
      ) {
        return {
          style: style as Style,
          hydration: hyd as Hydration,
          schedule: sched as Schedule,
        };
      }
    }
  }
  return null;
}

export function comboTitle(c: Combo, displayName: string, scheduleLabel: string): string {
  return `${c.hydration}% Hydration ${scheduleLabel} ${displayName}`;
}

export const SCHEDULE_LABELS: Record<Schedule, string> = {
  'same-day': 'Same-Day',
  overnight: 'Overnight',
  slow: 'Slow-Fermented',
};
