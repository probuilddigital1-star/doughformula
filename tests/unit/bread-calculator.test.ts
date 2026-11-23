import { describe, it, expect } from 'vitest';
import { hydrationWithStarter, starterHydrationNote } from '../../src/lib/bread-calculator';
import { printed, row, stateWith } from './helpers/bread-calculator';

const sumsToTotal = (p: ReturnType<typeof printed>) => expect(Math.abs(p.rowsTotal - p.recipe.totalDough)).toBeLessThanOrEqual(2);

describe('reader report: with a preferment on, the printed list still adds up to the stated total', () => {
  it('defaults (2 x 900 g, 75%, 2% salt, 20% starter at 100%) plus a 20% poolish', () => {
    const p = printed(stateWith({ wholeGrain: 0, prefermentType: 'poolish', prefermentPercent: 20 }));
    expect(p.recipe.totalDough).toBe(1800);
    expect(row(p, 'Flour')?.weight).toBe(731);
    expect(row(p, 'Water')?.weight).toBe(503);
    expect(row(p, 'Salt')?.weight).toBe(18);
    expect(row(p, 'All of the Poolish')?.weight).toBe(366);
    // The starter is part of the 1800 g, so it has to be on the list.
    expect(row(p, 'Sourdough Starter')?.weight).toBe(183);
    expect(p.rowsTotal).toBe(1801);
    sumsToTotal(p);
  });

  it('keeps the starter row for every preferment type and amount', () => {
    for (const prefermentType of ['poolish', 'biga', 'pate-fermentee', 'levain'] as const) {
      for (const prefermentPercent of [15, 20, 30, 40]) {
        const p = printed(stateWith({ prefermentType, prefermentPercent }));
        expect(row(p, 'Sourdough Starter')?.weight, `${prefermentType} ${prefermentPercent}%`).toBe(183);
        sumsToTotal(p);
      }
    }
  });

  it('keeps the yeast row too, which was dropped the same way', () => {
    const p = printed(stateWith({ yeastType: 'instant', yeastPercent: 1, wholeGrain: 0, prefermentType: 'biga' }));
    expect(row(p, 'Instant Yeast')?.weight).toBe(10);
    sumsToTotal(p);
  });

  it('prints the same list as before when there is no preferment', () => {
    const p = printed(stateWith());
    expect(p.rows.map((r) => [r.name, r.weight, r.percent])).toEqual([
      ['Bread Flour', 823, 90],
      ['Whole Wheat Flour', 91, 10],
      ['Water', 686, 75],
      ['Salt', 18, 2],
      ['Sourdough Starter', 183, 20],
    ]);
    sumsToTotal(p);
  });
});

describe('hydration with the starter counted', () => {
  it('defaults: 75% with 20% starter at 100% is 77.3%', () => {
    // Per 100 g flour: 75 g water plus 10 g from the starter, over 100 g flour plus 10 g.
    expect(hydrationWithStarter(stateWith())).toBeCloseTo((85 / 110) * 100, 10);
    expect(starterHydrationNote(stateWith())).toBe("With the starter's flour and water counted, hydration is 77.3%.");
  });

  it('follows the starter amount and the starter hydration', () => {
    expect(starterHydrationNote(stateWith({ yeastPercent: 40 }))).toBe("With the starter's flour and water counted, hydration is 79.2%.");
    expect(starterHydrationNote(stateWith({ starterHydration: 50 }))).toBe("With the starter's flour and water counted, hydration is 72.1%.");
    expect(starterHydrationNote(stateWith({ hydration: 100, starterHydration: 100 }))).toBe("With the starter's flour and water counted, hydration is 100%.");
  });

  it('reads the same at any batch size, and with a preferment on', () => {
    const note = starterHydrationNote(stateWith());
    expect(starterHydrationNote(stateWith({ numLoaves: 1, loafWeight: 200 }))).toBe(note);
    expect(starterHydrationNote(stateWith({ numLoaves: 12, loafWeight: 2000 }))).toBe(note);
    expect(starterHydrationNote(stateWith({ prefermentType: 'poolish', prefermentPercent: 40 }))).toBe(note);
  });

  it('matches the printed grams', () => {
    const p = printed(stateWith({ numLoaves: 12, loafWeight: 2000 }));
    const { waterWeight, flourWeight, starterWaterContrib, starterFlourContrib } = p.recipe;
    expect(((waterWeight + starterWaterContrib) / (flourWeight + starterFlourContrib)) * 100).toBeCloseTo(hydrationWithStarter(p.state)!, 1);
  });

  it('is not shown without a starter', () => {
    for (const yeastType of ['instant', 'active-dry', 'fresh'] as const) {
      expect(starterHydrationNote(stateWith({ yeastType, yeastPercent: 1 }))).toBeNull();
    }
  });

  it('has no em dash', () => {
    expect(starterHydrationNote(stateWith())).not.toMatch(/[–—]|--/);
  });
});
