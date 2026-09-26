// Pure baker's percentage math for /bakers-percentage-calculator/. Every ingredient is
// expressed against the total of the flour rows, which is always 100%. A starter row is an
// ingredient like any other here.
import { roundG, roundPct } from './hydration';

export type RowKind = 'flour' | 'water' | 'starter' | 'other';

export interface Row {
  name: string;
  kind: RowKind;
  grams: number;
}

export interface PctRow {
  name: string;
  kind: RowKind;
  pct: number;
}

export const DEFAULT_ROWS: Row[] = [
  { name: 'Bread flour', kind: 'flour', grams: 500 },
  { name: 'Water', kind: 'water', grams: 350 },
  { name: 'Salt', kind: 'other', grams: 10 },
  { name: 'Starter', kind: 'starter', grams: 100 },
];

const num = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);
const sum = (rows: Row[], kind: RowKind): number =>
  rows.filter((r) => r.kind === kind).reduce((t, r) => t + num(r.grams), 0);

export function toPercentages(rows: Row[]): PctRow[] {
  const flour = sum(rows, 'flour');
  return rows.map((r) => ({
    name: r.name,
    kind: r.kind,
    pct: flour > 0 ? roundPct((num(r.grams) / flour) * 100) : 0,
  }));
}

/** Gram weights from percentages. flourG is the total flour; flour rows share it by their
 *  percentages, so two flour rows at 80 and 20 split it 80/20. */
export function toGrams(flourG: number, rows: PctRow[]): Row[] {
  const flour = num(flourG);
  return rows.map((r) => ({ name: r.name, kind: r.kind, grams: roundG((flour * num(r.pct)) / 100) }));
}

export const SALT_MIN = 1.5;
export const SALT_MAX = 2.5;
export const SALT_DEFAULT = 2;

export function saltGrams(flourG: number, pct: number): number {
  const p = Math.min(SALT_MAX, Math.max(SALT_MIN, Number.isFinite(pct) ? pct : SALT_DEFAULT));
  return roundG((num(flourG) * p) / 100);
}
