import { describe, it, expect } from 'vitest';
import { DEFAULT_ROWS, toPercentages, toGrams, rowsHydration, saltGrams } from '../../src/lib/bakers-percentage';

describe('DEFAULT_ROWS', () => {
  it('is a four-line sourdough', () => {
    expect(DEFAULT_ROWS).toEqual([
      { name: 'Bread flour', kind: 'flour', grams: 500 },
      { name: 'Water', kind: 'water', grams: 350 },
      { name: 'Salt', kind: 'other', grams: 10 },
      { name: 'Starter', kind: 'starter', grams: 100 },
    ]);
  });
});

describe('toPercentages', () => {
  it('puts flour at 100% and everything else against it', () => {
    expect(toPercentages(DEFAULT_ROWS).map((r) => r.pct)).toEqual([100, 70, 2, 20]);
  });
  it('splits 100% across several flour rows', () => {
    const out = toPercentages([
      { name: 'Bread flour', kind: 'flour', grams: 400 },
      { name: 'Whole wheat', kind: 'flour', grams: 100 },
      { name: 'Water', kind: 'water', grams: 375 },
    ]);
    expect(out.map((r) => r.pct)).toEqual([80, 20, 75]);
  });
  it('returns zeros when there is no flour', () => {
    expect(toPercentages([{ name: 'Water', kind: 'water', grams: 100 }])[0].pct).toBe(0);
  });
});

describe('toGrams', () => {
  it('scales percentages from the flour weight', () => {
    const out = toGrams(500, [
      { name: 'Flour', kind: 'flour', pct: 100 },
      { name: 'Water', kind: 'water', pct: 72 },
      { name: 'Salt', kind: 'other', pct: 2 },
    ]);
    expect(out.map((r) => r.grams)).toEqual([500, 360, 10]);
  });
});

describe('rowsHydration', () => {
  it('counts the starter as half flour, half water by default', () => {
    expect(rowsHydration(DEFAULT_ROWS)).toBe(72.7);
  });
  it('is plain water over flour without starter', () => {
    expect(rowsHydration([
      { name: 'Flour', kind: 'flour', grams: 1000 },
      { name: 'Water', kind: 'water', grams: 680 },
    ])).toBe(68);
  });
});

describe('saltGrams', () => {
  it('works out salt from flour and percent', () => {
    expect(saltGrams(500, 2)).toBe(10);
    expect(saltGrams(500, 1.5)).toBe(8);
    expect(saltGrams(1000, 2.2)).toBe(22);
  });
  it('clamps the percent to 1.5 to 2.5', () => {
    expect(saltGrams(500, 3)).toBe(13);
    expect(saltGrams(500, 1)).toBe(8);
  });
});
