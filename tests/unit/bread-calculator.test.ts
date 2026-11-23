import { describe, it, expect } from 'vitest';
import {
  BREAD_STYLES,
  applyStyle,
  createDefaultEnrichments,
  createDefaultState,
  eggWeight,
  formatWeight,
  hydrationWithStarter,
  roundSmall,
  starterHydrationNote,
  type EnrichmentState,
} from '../../src/lib/bread-calculator';
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

describe('enrichments are inside the stated total', () => {
  const brioche = () => {
    const state = createDefaultState();
    const style = BREAD_STYLES.find((s) => s.id === 'brioche')!;
    applyStyle(state, { ...style, style: style.id });
    return state;
  };
  const enrich = (change: (e: EnrichmentState) => void): EnrichmentState => {
    const e = createDefaultEnrichments();
    change(e);
    return e;
  };

  it('audit example: Brioche, 2 x 900 g, butter 25%, 4 eggs, sugar 8% adds up to 1800 g (was 2376 g)', () => {
    const p = printed(brioche(), enrich((e) => {
      e.fat = { enabled: true, type: 'butter', percent: 25 };
      e.eggs = { enabled: true, type: 'whole', count: 4 };
      e.sweet = { enabled: true, type: 'sugar', percent: 8 };
    }));
    expect(p.recipe.totalDough).toBe(1800);
    // 1800 g less 200 g of eggs, over 1 + 55% + 1.8% + 1.2% + 25% + 8%.
    expect(p.recipe.flourWeight).toBe(Math.round(1600 / 1.91));
    expect(row(p, 'Butter')?.weight).toBe(Math.round(838 * 0.25));
    expect(row(p, 'Eggs (4)')?.weight).toBe(200);
    expect(row(p, 'Sugar')?.weight).toBe(Math.round(838 * 0.08));
    sumsToTotal(p);
  });

  it('adds nothing to the flour when no enrichment is on', () => {
    const plain = printed(stateWith());
    const off = printed(stateWith(), enrich((e) => {
      e.fat.percent = 25;
      e.sweet.percent = 20;
      e.eggs.count = 6;
    }));
    expect(off.rows).toEqual(plain.rows);
    expect(plain.recipe.flourWeight).toBe(Math.round(1800 / 1.97));
  });

  it('milk takes its share of the liquid and gets its own row', () => {
    const state = stateWith({ yeastType: 'instant', yeastPercent: 1, wholeGrain: 0, hydration: 62, salt: 1.8 });
    const plain = printed(state);
    const p = printed(state, enrich((e) => { e.dairy = { enabled: true, type: 'whole-milk', percentOfLiquid: 50 }; }));
    const liquid = row(plain, 'Water')!.weight;
    expect(p.recipe.flourWeight).toBe(plain.recipe.flourWeight);
    expect(row(p, 'Whole Milk')?.weight).toBe(Math.round(liquid / 2));
    expect(row(p, 'Water')!.weight + row(p, 'Whole Milk')!.weight).toBe(liquid);
    expect(row(p, 'Water')?.percent).toBeCloseTo(31, 0);
    sumsToTotal(p);
  });

  it('cream for all of the liquid leaves no water row', () => {
    const p = printed(stateWith(), enrich((e) => { e.dairy = { enabled: true, type: 'cream', percentOfLiquid: 100 }; }));
    expect(row(p, 'Water')).toBeUndefined();
    expect(row(p, 'Heavy Cream')?.weight).toBe(p.recipe.liquidWeight);
    sumsToTotal(p);
  });

  it('a whole egg, a yolk and a white weigh 50 g, 17 g and 33 g', () => {
    expect(eggWeight('whole', 2)).toBe(100);
    expect(eggWeight('yolks', 2)).toBe(34);
    expect(eggWeight('whites', 2)).toBe(66);
    const p = printed(stateWith(), enrich((e) => { e.eggs = { enabled: true, type: 'yolks', count: 2 }; }));
    expect(row(p, 'Egg Yolks (2)')?.weight).toBe(34);
    sumsToTotal(p);
  });

  it('uses the most eggs that fit when the count asked for is over half the dough, and says so', () => {
    const p = printed(stateWith({ numLoaves: 1, loafWeight: 200 }), enrich((e) => { e.eggs = { enabled: true, type: 'whole', count: 4 }; }));
    const eggs = row(p, 'Eggs (2)')!;
    expect(eggs.weight).toBe(100);
    expect(eggs.note).toBe('(the most that fit this batch)');
    expect(p.recipe.flourWeight).toBeGreaterThan(0);
    sumsToTotal(p);
  });

  it('effective hydration counts the water in the milk, butter and eggs on the list', () => {
    const p = printed(brioche(), enrich((e) => {
      e.fat = { enabled: true, type: 'butter', percent: 25 };
      e.eggs = { enabled: true, type: 'whole', count: 4 };
      e.dairy = { enabled: true, type: 'whole-milk', percentOfLiquid: 100 };
    }));
    const water = row(p, 'Whole Milk')!.weight * 0.87 + row(p, 'Butter')!.weight * 0.15 + 200 * 0.75;
    expect(p.recipe.effectiveHydration).toBe(Math.round((water / p.recipe.flourWeight) * 100));
  });
});

describe('small amounts keep a decimal', () => {
  const noKnead = (numLoaves: number, loafWeight: number) => {
    const state = createDefaultState();
    const style = BREAD_STYLES.find((s) => s.id === 'no-knead')!;
    applyStyle(state, { ...style, style: style.id });
    return printed(Object.assign(state, { numLoaves, loafWeight }));
  };

  it('No-Knead yeast: 0.69 g for one 500 g loaf (was "1g") and 0.28 g for one 200 g loaf (was "0g")', () => {
    expect(row(noKnead(1, 500), 'Instant Yeast')?.weight).toBe(0.69);
    expect(row(noKnead(1, 200), 'Instant Yeast')?.weight).toBe(0.28);
  });

  it('whole grams from 10 g, tenths under 10 g, hundredths under 1 g, never zero', () => {
    expect(roundSmall(18.28)).toBe(18);
    expect(roundSmall(9.96)).toBe(10);
    expect(roundSmall(5.54)).toBe(5.5);
    expect(roundSmall(0.996)).toBe(1);
    expect(roundSmall(0.277)).toBe(0.28);
    expect(roundSmall(0.004)).toBe(0.01);
    expect(roundSmall(0)).toBe(0);
  });

  it('salt under 10 g prints to a tenth', () => {
    expect(row(noKnead(1, 500), 'Salt')?.weight).toBe(5.5);
    expect(formatWeight(stateWith(), 5.5)).toBe('5.5g');
  });
});
