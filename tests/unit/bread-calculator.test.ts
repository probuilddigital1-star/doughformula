import { describe, it, expect } from 'vitest';
import {
  BREAD_STYLES,
  applyStyle,
  applyStyleEnrichments,
  createDefaultEnrichments,
  createDefaultState,
  eggWeight,
  formatWeight,
  hydrationWithStarter,
  isValidBlend,
  roundSmall,
  starterHydrationNote,
  type EnrichmentState,
  type RecipeState,
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

  it('keeps the starter on the list for a poolish or biga of any size', () => {
    for (const prefermentType of ['poolish', 'biga'] as const) {
      for (const prefermentPercent of [15, 20, 30, 40]) {
        const p = printed(stateWith({ prefermentType, prefermentPercent }));
        expect(row(p, 'Sourdough Starter')?.weight, `${prefermentType} ${prefermentPercent}%`).toBe(Math.round(p.recipe.flourWeight * 0.2));
        sumsToTotal(p);
      }
    }
  });

  it('keeps the yeast row too, which was dropped the same way', () => {
    const p = printed(stateWith({ yeastType: 'instant', yeastPercent: 1, wholeGrain: 0, prefermentType: 'biga' }));
    // The biga's pinch comes out of the recipe's 1% yeast: 0.2% of a fifth of the flour.
    const pinch = p.prefermentRows.find((r) => r.name === 'Instant Yeast')!.weight;
    expect(pinch).toBe(0.4);
    expect(row(p, 'Instant Yeast')?.weight).toBe(9.7);
    expect(row(p, 'Instant Yeast')?.percent).toBe(0.96);
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

describe('preferments: every gram is listed once', () => {
  const styled = (id: string, over: Partial<RecipeState> = {}) => {
    const state = createDefaultState();
    const style = BREAD_STYLES.find((s) => s.id === id)!;
    applyStyle(state, { ...style, style: style.id });
    return Object.assign(state, over);
  };
  const box = (p: ReturnType<typeof printed>, name: string) => p.prefermentRows.find((r) => r.name === name);

  it('C: Baguette with a 30% poolish shows what is left, 70% flour and 38% water (was 100% and 68%)', () => {
    const p = printed(styled('baguette', { prefermentType: 'poolish', prefermentPercent: 30 }));
    const flour = p.recipe.flourWeight;
    expect(row(p, 'Flour')).toMatchObject({ percent: 70, note: '(remaining)' });
    expect(row(p, 'Water')).toMatchObject({ percent: 38, note: '(remaining)' });
    expect(Math.abs(row(p, 'Flour')!.weight - flour * 0.7)).toBeLessThanOrEqual(1);
    expect(Math.abs(row(p, 'Water')!.weight - flour * 0.38)).toBeLessThanOrEqual(1);
    sumsToTotal(p);
  });

  it('C2: whole wheat is 10% of all the flour, 91 g, with a 20% poolish on (was 73 g)', () => {
    const p = printed(stateWith({ prefermentType: 'poolish', prefermentPercent: 20 }));
    expect(p.recipe.flourWeight).toBe(914);
    expect(row(p, 'Whole Wheat Flour')).toMatchObject({ weight: 91, percent: 10 });
    expect(row(p, 'Bread Flour')).toMatchObject({ weight: 914 - 91 - 183, percent: 70 });
    expect(box(p, 'Bread Flour')).toMatchObject({ weight: 183, note: '(20% of total)' });
    sumsToTotal(p);
  });

  it('G: a levain replaces the starter row, and its seed starter is in the box and in the total', () => {
    const p = printed(stateWith({ prefermentType: 'levain', prefermentPercent: 20 }));
    // 1800 g over 1 + 75% + 2% + 4% (the seed: 20% of the fifth of the flour in the levain).
    expect(Math.abs(p.recipe.flourWeight - 1800 / 1.81)).toBeLessThanOrEqual(1);
    expect(row(p, 'Sourdough Starter')).toBeUndefined();
    const [flour, water, seed] = p.prefermentRows;
    expect([flour.name, water.name, seed.name]).toEqual(['Bread Flour', 'Water', 'Active Starter']);
    expect(water.weight).toBe(flour.weight);
    expect(seed.weight).toBe(Math.round(p.recipe.flourWeight * 0.04));
    expect(row(p, 'All of the Levain')?.weight).toBe(flour.weight + water.weight + seed.weight);
    sumsToTotal(p);
    // The line under the list counts the seed as the starter.
    expect(starterHydrationNote(p.state)).toBe("With the starter's flour and water counted, hydration is 75.5%.");
  });

  it('G: a yeast style keeps its yeast row next to a levain', () => {
    const p = printed(styled('baguette', { prefermentType: 'levain', prefermentPercent: 20 }));
    expect(row(p, 'Instant Yeast')).toMatchObject({ percent: 0.5, note: '' });
    expect(box(p, 'Active Starter')?.weight).toBe(Math.round(p.recipe.flourWeight * 0.04));
    sumsToTotal(p);
  });

  it('F: pâte fermentée in a sourdough recipe is raised with starter, not "Instant Yeast 37g"', () => {
    const p = printed(stateWith({ prefermentType: 'pate-fermentee', prefermentPercent: 20 }));
    expect(box(p, 'Instant Yeast')).toBeUndefined();
    // The old dough holds a fifth of everything: flour, water, salt and starter.
    expect(box(p, 'Sourdough Starter')?.weight).toBe(37);
    expect(row(p, 'Sourdough Starter')).toMatchObject({ weight: 146, percent: 16, note: '(remaining)' });
    sumsToTotal(p);
  });

  it('F: in a yeast recipe it carries the recipe yeast at the recipe share, in the yeast type picked', () => {
    const p = printed(styled('baguette', { yeastType: 'fresh', yeastPercent: 1.5, prefermentType: 'pate-fermentee', prefermentPercent: 20 }));
    const oldDoughFlour = box(p, 'Flour')!.weight;
    expect(Math.abs(box(p, 'Fresh Yeast')!.weight - oldDoughFlour * 0.015)).toBeLessThanOrEqual(0.06);
    expect(row(p, 'Fresh Yeast')?.percent).toBe(1.2);
    sumsToTotal(p);
  });

  it('J8: old dough carries its salt, and that salt comes out of the salt row', () => {
    const p = printed(stateWith({ prefermentType: 'pate-fermentee', prefermentPercent: 20 }));
    expect(box(p, 'Salt')).toMatchObject({ weight: 3.7, note: '(2%, as in the dough)' });
    expect(row(p, 'Salt')).toMatchObject({ weight: 15, percent: 1.6, note: '(remaining)' });
    for (const prefermentType of ['poolish', 'biga', 'levain'] as const) {
      const other = printed(stateWith({ prefermentType }));
      expect(other.prefermentRows.some((r) => r.name === 'Salt'), prefermentType).toBe(false);
      expect(row(other, 'Salt')?.percent, prefermentType).toBe(2);
    }
  });

  it('J8: a biga takes 0.2% yeast, a poolish 0.1%, out of the recipe yeast and in the yeast type picked', () => {
    const biga = printed(styled('ciabatta', { prefermentType: 'biga', prefermentPercent: 40 }));
    expect(box(biga, 'Instant Yeast')?.weight).toBeCloseTo(box(biga, 'Flour')!.weight * 0.002, 1);
    expect(row(biga, 'Instant Yeast')?.percent).toBe(0.52);

    const activeDry = printed(styled('ciabatta', { yeastType: 'active-dry', yeastPercent: 0.75, prefermentType: 'poolish', prefermentPercent: 40 }));
    expect(box(activeDry, 'Instant Yeast')).toBeUndefined();
    expect(box(activeDry, 'Active Dry Yeast')?.weight).toBeCloseTo(box(activeDry, 'Flour')!.weight * 0.00125, 1);
    expect(row(activeDry, 'Active Dry Yeast')?.percent).toBe(0.7);
  });

  it('a sourdough recipe has no yeast row to take from, so the pinch of instant yeast is on top and in the total', () => {
    const p = printed(stateWith({ prefermentType: 'poolish', prefermentPercent: 40 }));
    expect(box(p, 'Instant Yeast')).toMatchObject({ weight: 0.37, note: '(tiny pinch)' });
    expect(row(p, 'Sourdough Starter')).toMatchObject({ percent: 20, note: '' });
    sumsToTotal(p);
  });

  it('a preferment bigger than the first flour takes the rest from the next one', () => {
    const blend = [{ type: 'bread', percent: 10 }, { type: 'whole-wheat', percent: 90 }];
    const p = printed(stateWith({ prefermentType: 'poolish', prefermentPercent: 20 }), undefined, blend);
    expect(p.prefermentRows.filter((r) => r.name.endsWith('Flour')).map((r) => [r.name, r.note])).toEqual([
      ['Bread Flour', '(10% of total)'],
      ['Whole Wheat Flour', '(10% of total)'],
    ]);
    expect(row(p, 'Bread Flour')).toBeUndefined();
    expect(row(p, 'Whole Wheat Flour')?.percent).toBe(80);
    sumsToTotal(p);
  });
});

describe('flour blends from the Flour tab', () => {
  it('prints one row per flour, by name', () => {
    const blend = [{ type: 'ap', percent: 50 }, { type: 'spelt', percent: 50 }];
    const p = printed(stateWith({ wholeGrain: 50 }), undefined, blend);
    expect(p.rows.filter((r) => r.name.endsWith('Flour')).map((r) => [r.name, r.percent])).toEqual([['All-Purpose Flour', 50], ['Spelt Flour', 50]]);
    expect(row(p, 'All-Purpose Flour')!.weight + row(p, 'Spelt Flour')!.weight).toBe(p.recipe.flourWeight);
  });

  it('one plain flour is split by the Whole Grain slider', () => {
    const p = printed(stateWith({ wholeGrain: 20 }), undefined, [{ type: 'ap', percent: 100 }]);
    expect(p.rows.slice(0, 2).map((r) => [r.name, r.percent])).toEqual([['All-Purpose Flour', 80], ['Whole Wheat Flour', 20]]);
  });

  it('a blend that is not 100% is not used', () => {
    expect(isValidBlend([{ type: 'bread', percent: 100 }])).toBe(true);
    expect(isValidBlend([{ type: 'bread', percent: 70 }, { type: 'whole-wheat', percent: 20 }, { type: 'rye-light', percent: 10 }])).toBe(true);
    expect(isValidBlend([{ type: 'bread', percent: 100 }, { type: 'whole-wheat', percent: 100 }])).toBe(false);
    expect(isValidBlend([{ type: 'bread', percent: 60 }])).toBe(false);
    const p = printed(stateWith(), undefined, [{ type: 'bread', percent: 100 }, { type: 'whole-wheat', percent: 100 }, { type: 'rye-light', percent: 50 }]);
    expect(p.rows).toEqual(printed(stateWith()).rows);
  });
});

describe('style cards switch on the enrichments their steps call for', () => {
  const card = (id: string, over: Partial<RecipeState> = {}) => {
    const state = createDefaultState();
    const style = BREAD_STYLES.find((s) => s.id === id)!;
    applyStyle(state, { ...style, style: style.id });
    const enrichments = createDefaultEnrichments();
    applyStyleEnrichments(enrichments, id);
    return printed(Object.assign(state, over), enrichments);
  };

  it('Brioche, 2 x 900 g: milk, butter 25%, 3 eggs and sugar 8% are on the list (was flour, water, salt, yeast)', () => {
    const p = card('brioche');
    expect(p.rows.map((r) => [r.name, r.weight, r.percent])).toEqual([
      ['Flour', 864, 100],
      ['Whole Milk', 475, 55],
      ['Salt', 16, 1.8],
      ['Instant Yeast', 10, 1.2],
      ['Butter', 216, 25],
      ['Eggs (3)', 150, 17.4],
      ['Sugar', 69, 8],
    ]);
    expect(p.rowsTotal).toBe(1800);
    // Milk at 87% water, butter at 15%, eggs at 75%.
    expect(p.recipe.effectiveHydration).toBe(65);
  });

  it('the Brioche egg count follows the batch size, about one egg for 250 g of flour', () => {
    expect(card('brioche', { numLoaves: 1, loafWeight: 500 }).recipe.eggCount).toBe(1);
    expect(card('brioche', { numLoaves: 2, loafWeight: 900 }).recipe.eggCount).toBe(3);
    expect(card('brioche', { numLoaves: 4, loafWeight: 900 }).recipe.eggCount).toBe(7);
    expect(card('brioche', { numLoaves: 1, loafWeight: 200 }).recipe.eggCount).toBe(1);
    for (const [numLoaves, loafWeight] of [[1, 200], [1, 500], [2, 900], [4, 900], [12, 2000]]) sumsToTotal(card('brioche', { numLoaves, loafWeight }));
  });

  it('a typed egg count stays put', () => {
    const enrichments = createDefaultEnrichments();
    applyStyleEnrichments(enrichments, 'brioche');
    enrichments.eggs.count = 5;
    enrichments.eggs.percentOfFlour = null;
    const state = card('brioche').state;
    expect(printed(state, enrichments).recipe.eggCount).toBe(5);
    expect(printed({ ...state, numLoaves: 4 }, enrichments).recipe.eggCount).toBe(5);
  });

  it('Focaccia gets 5% olive oil and a Sandwich Loaf 5% butter', () => {
    expect(row(card('focaccia'), 'Oil')).toMatchObject({ percent: 5 });
    expect(row(card('sandwich'), 'Butter')).toMatchObject({ percent: 5 });
    sumsToTotal(card('focaccia'));
    sumsToTotal(card('sandwich'));
  });

  it('every style lists what its own steps tell the baker to add', () => {
    const calledFor: Array<[RegExp, RegExp]> = [
      [/\b(butter|oil)\b/i, /^(Butter|Oil)$/],
      [/\beggs\b/i, /^Egg/],
      [/\bmilk\b/i, /Milk$/],
      [/\b(sugar|honey)\b/i, /^(Sugar|Honey)$/],
    ];
    for (const style of BREAD_STYLES) {
      // Shaping and baking steps (an oiled pan, an egg wash) are not dough ingredients.
      const mixing = style.instructions.filter((step) => /^(mix|add|gradually add)\b/i.test(step)).join(' ');
      const p = card(style.id);
      for (const [inSteps, onList] of calledFor) {
        expect(p.rows.some((r) => onList.test(r.name)), `${style.id}: ${inSteps}`).toBe(inSteps.test(mixing));
      }
    }
  });

  it('picking another style switches them off again', () => {
    const enrichments = createDefaultEnrichments();
    applyStyleEnrichments(enrichments, 'brioche');
    applyStyleEnrichments(enrichments, 'sourdough');
    expect(enrichments).toEqual(createDefaultEnrichments());
  });

  it('no step still names a spoon measure for something the list now weighs', () => {
    for (const style of BREAD_STYLES) expect(style.instructions.join(' '), style.id).not.toMatch(/tbsp/);
  });
});
