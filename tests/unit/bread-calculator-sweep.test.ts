import { beforeAll, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BREAD_STYLES,
  DEFAULT_YEAST_PERCENT,
  HYDRATION_MAX,
  HYDRATION_MIN,
  LOAF_WEIGHT_MAX,
  STYLE_DDT_DEFAULTS,
  YEAST_CONVERSIONS,
  applyStyle,
  applyUrlRecipeParams,
  applyYeastType,
  calculateWaterTemp,
  calculateWholeGrainPercent,
  clampToField,
  createDefaultState,
  estimateFermentationTimes,
  formatHourRange,
  formatScheduleTime,
  formatTemp,
  formatTempDifference,
  formatWeight,
  generateBakingSchedule,
  parseUrlRecipeParams,
  recipeCopyText,
  scheduleIcs,
  waterTempFormulaText,
  waterTempWarningText,
  yeastBloomNote,
  yeastSliderRange,
  type RecipeState,
} from '../../src/lib/bread-calculator';
import { printed, stateWith } from './helpers/bread-calculator';
import { SWEEP_SIZE, runSweep, type SweepResult, type Tally } from './helpers/bread-calculator-sweep';

/**
 * The calculator math audit, kept as a permanent test. Everything here runs the code the
 * homepage runs (src/lib/bread-calculator.ts).
 *
 * Plain `it` tests are things that hold today and must keep holding. `it.fails` tests are
 * KNOWN ISSUES from the audit: each states the behavior a baker should get, and vitest
 * expects it to fail until the issue is fixed. When a fix lands, the test starts passing,
 * vitest reports that, and the `.fails` comes off. Tests marked FLAGGED pin today's behavior
 * where the right answer is a judgment call for the site owner, so a change there is a
 * decision and not an accident.
 */

const styleState = (id: string, over: Partial<RecipeState> = {}): RecipeState => {
  const state = createDefaultState();
  const style = BREAD_STYLES.find((s) => s.id === id)!;
  applyStyle(state, { ...style, style: style.id });
  return Object.assign(state, over);
};

/** Fails with every unexpected group spelled out, so a new kind of violation is readable. */
function expectOnlyKnown(tally: Tally, known: Array<string | RegExp>): void {
  const unexpected = [...tally.groups.keys()].filter((g) => !known.some((k) => (typeof k === 'string' ? k === g : k.test(g))));
  expect(unexpected, tally.describe()).toEqual([]);
}
const expectClean = (tally: Tally, group: string | RegExp) => {
  const hits = [...tally.groups.entries()].filter(([g]) => (typeof group === 'string' ? g === group : group.test(g)));
  expect(hits.map(([g, v]) => `${g}: ${v.count} case(s), e.g. ${v.examples[0].case} -> ${v.examples[0].detail}`)).toEqual([]);
};

describe('bread calculator sweep: style x preferment x yeast x starter x enrichments x batch size, in grams and ounces', () => {
  let sweep: SweepResult;
  beforeAll(() => {
    sweep = runSweep();
  }, 120_000);

  it('covers the whole grid', () => {
    // 8 styles x 4 basics x 18 yeast settings x 13 preferment settings x 5 sizes x 10 enrichment sets
    expect(SWEEP_SIZE).toBe(8 * 4 * 18 * 13 * 5 * 10);
    expect(sweep.cases).toBe(SWEEP_SIZE);
  });

  describe('1. printed rows sum to the stated total within 2 g', () => {
    it('holds for every case with no butter, oil, eggs or sweetener, with and without a preferment', () => {
      expectClean(sweep.rowsSum, 'no weight-adding enrichment');
    });

    it('also holds with butter, oil, eggs or a sweetener switched on (was KNOWN ISSUE A)', () => {
      expectClean(sweep.rowsSum, 'butter, oil, eggs or sweetener on');
      expectOnlyKnown(sweep.rowsSum, []);
    });
  });

  describe('2. each printed percentage matches its grams divided by total flour', () => {
    it('holds for every row when there is no preferment, to the nearest gram', () => {
      expectClean(sweep.percentages, /row, no preferment$/);
      expectClean(sweep.percentages, /^(Salt|.*Yeast|Sourdough Starter|Butter|Oil|Egg.*|Sugar|Honey|Maple|Malt|Whole Milk|Buttermilk|Heavy Cream) row$/);
    });

    it('flour and water percentages still match their grams when a preferment is on (was KNOWN ISSUE C)', () => {
      expectClean(sweep.percentages, /^(flour|Water) row, with /);
      expectOnlyKnown(sweep.percentages, []);
    });

    it('salt and yeast are never more than 10% off after rounding, or 0.01 g under a tenth of a gram (was KNOWN ISSUE D)', () => {
      expectClean(sweep.percentages, /^small amount misstated by rounding/);
    });
  });

  describe('3. no negative, NaN or blank values', () => {
    it('holds for every case inside the ranges the sliders and fields allow', () => {
      expectClean(sweep.values, 'not a number');
      expectClean(sweep.values, 'negative');
      expectClean(sweep.values, 'preferment row prints 0 g');
    });

    it('a yeast amount above zero never prints as 0 g (was KNOWN ISSUE D)', () => {
      expectClean(sweep.values, 'prints 0 g (yeast)');
      expectOnlyKnown(sweep.values, []);
    });

    it('a number typed into a field is held to the field limits (Q)', () => {
      expect(clampToField(-2, 1, 12, 1)).toBe(1);
      expect(clampToField(40, 1, 12, 1)).toBe(12);
      expect(clampToField(NaN, 200, 2000, 500)).toBe(500);
      expect(clampToField(-5, 1, 30, 5)).toBe(1);
      expect(clampToField(650, 200, 2000, 500)).toBe(650);
      const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');
      // Every number field is read through its limits: loaves, weight, butter, eggs, milk, sugar, flour blend.
      expect(src.split('fieldNumber(e.target as HTMLInputElement').length - 1).toBe(7);
      // The old pattern, "parseInt(field value) || fallback", let a minus sign through.
      expect(src).not.toMatch(/\.value\) \|\| \d/);
    });

    it('a junk or negative loaf count in the link cannot reach the recipe (was KNOWN ISSUE Q)', () => {
      const read = (query: string) => parseUrlRecipeParams(new URLSearchParams(query));
      expect(read('loaves=abc&weight=-900')).toEqual({});
      expect(read('loaves=0&weight=0')).toEqual({});
      expect(read('weight=99999')).toEqual({ weight: LOAF_WEIGHT_MAX });
      // Hand-off links can ask for a small weight or many loaves, and still get them.
      expect(read('loaves=14&weight=97')).toEqual({ loaves: 14, weight: 97 });
      for (const query of ['loaves=abc', 'loaves=-2', 'weight=-900', 'loaves=&weight=', 'loaves=1e9x&weight=NaN']) {
        const state = createDefaultState();
        applyUrlRecipeParams(state, parseUrlRecipeParams(new URLSearchParams(query)));
        for (const r of printed(state).rows) {
          expect(Number.isFinite(r.weight), `?${query}: ${r.name} ${formatWeight(state, r.weight)}`).toBe(true);
          expect(r.weight, `?${query}: ${r.name} ${formatWeight(state, r.weight)}`).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('a flour blend that adds up past 100% cannot print negative flour (was KNOWN ISSUE T)', () => {
      // The Flour tab warns "Total flour must equal 100%" and still prints the recipe.
      const blend = [{ type: 'bread', percent: 100 }, { type: 'whole-wheat', percent: 100 }, { type: 'rye-light', percent: 50 }];
      const p = printed(stateWith({ wholeGrain: calculateWholeGrainPercent(blend) }), undefined, blend);
      for (const r of p.rows) expect(r.weight, `${r.name} ${r.weight} g`).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. preferment flour and water are taken out of the main rows exactly once', () => {
    it('holds for every preferment type and amount', () => {
      expectClean(sweep.preferment, 'flour or water not removed exactly once');
      expectClean(sweep.preferment, 'preferment box does not list the flour and water taken out');
      expectClean(sweep.preferment, 'rows differ from the recipe without a preferment');
    });

    it('salt and leavening are each listed once too, and only old dough carries salt', () => {
      expectClean(sweep.preferment, 'salt in the wrong preferment');
      expectClean(sweep.preferment, 'salt not listed exactly once');
      expectClean(sweep.preferment, 'leavening not listed exactly once');
    });

    it("pâte fermentée is leavened like the recipe: same yeast or starter, same share (was KNOWN ISSUE F)", () => {
      expectClean(sweep.preferment, "pate-fermentee leavening is not the recipe's own");
    });

    it('what the preferment box says to mix weighs what the "All of the ..." row says (was KNOWN ISSUE G)', () => {
      expectClean(sweep.preferment, / box does not weigh what the "All of the" row says$/);
    });

    it('a levain is seeded with 20% starter, replaces the starter row, and leaves a yeast row alone', () => {
      expectClean(sweep.preferment, 'levain seed is not 20% of its flour');
      expectClean(sweep.preferment, 'levain did not replace the starter row, or changed the yeast row');
    });

    it('a poolish or biga takes a pinch of the yeast type picked, or of instant yeast in a sourdough recipe', () => {
      expectClean(sweep.preferment, / yeast is not the yeast type picked$/);
      expectClean(sweep.preferment, / yeast is more than a pinch$/);
      expectClean(sweep.preferment, / in a sourdough recipe changed the starter row or lost its yeast$/);
      expectOnlyKnown(sweep.preferment, []);
    });
  });

  describe('5. ounce values match the gram values', () => {
    it('every ounce value is its gram value converted, and the ounce rows stay within half an ounce of the ounce total', () => {
      expectClean(sweep.ounces, 'ounce value is not the gram value converted');
      expectClean(sweep.ounces, 'ounce rows drift from the ounce total');
    });

    it('a real amount never prints as 0.0oz (was KNOWN ISSUE E)', () => {
      expectClean(sweep.ounces, 'prints 0.0oz for a real amount');
    });

    it('no ounce value is more than 10% away from its grams, in the list or the preferment box (was KNOWN ISSUE E)', () => {
      expectClean(sweep.ounces, 'tenth of an ounce is too coarse (more than 10% off)');
      expectOnlyKnown(sweep.ounces, []);
    });

    it('small amounts keep two figures under an ounce: 2 g is 0.071oz (was "0.1oz"), 1 g is 0.035oz (was "0.0oz")', () => {
      const oz = stateWith({ unit: 'oz' });
      expect(formatWeight(oz, 2)).toBe('0.071oz');
      expect(formatWeight(oz, 1)).toBe('0.035oz');
      expect(formatWeight(oz, 0.69)).toBe('0.024oz');
      expect(formatWeight(oz, 18)).toBe('0.63oz');
      expect(formatWeight(oz, 28.3)).toBe('1.0oz');
      expect(formatWeight(oz, 183)).toBe('6.5oz');
      expect(formatWeight(oz, 1800)).toBe('63.5oz');
    });

    it('the preferment box prints in ounces when ounces are picked (was E2: grams)', () => {
      const p = printed(stateWith({ unit: 'oz', prefermentType: 'poolish' }));
      expect(p.prefermentRows.map((r) => formatWeight(p.state, r.weight))).toEqual(['6.5oz', '6.5oz', '0.0063oz']);
      const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');
      const boxMarkup = src.slice(src.indexOf('const prefIngs = calc.prefermentRows(state, recipe);'), src.indexOf("ingredientsHeading.textContent = 'Ingredients';"));
      expect(boxMarkup).toContain('<span>${formatWeight(ing.weight)}</span>');
    });
  });

  describe('6. enrichments: effective hydration matches the water the tab says milk, eggs and butter carry', () => {
    it('matches within one point, recomputed from the printed rows and the stated water shares', () => {
      expectClean(sweep.effectiveHydration, 'does not match the stated water shares');
      expectClean(sweep.effectiveHydration, 'differs from plain hydration with no enrichments');
    });

    it('milk or cream that the number counts is on the ingredient list (was KNOWN ISSUE B)', () => {
      expectClean(sweep.effectiveHydration, 'milk or cream is counted but not on the ingredient list');
      expectOnlyKnown(sweep.effectiveHydration, []);
    });
  });
});

describe('7. yeast: instant, active dry and fresh', () => {
  it('the default amounts are in the standard ratio 1 : 1.25 : 3', () => {
    expect(DEFAULT_YEAST_PERCENT['active-dry'] / DEFAULT_YEAST_PERCENT.instant).toBe(YEAST_CONVERSIONS['active-dry']);
    expect(DEFAULT_YEAST_PERCENT.fresh / DEFAULT_YEAST_PERCENT.instant).toBe(YEAST_CONVERSIONS.fresh);
    expect(YEAST_CONVERSIONS).toMatchObject({ instant: 1, 'active-dry': 1.25, fresh: 3 });
  });

  it('switching between instant, active dry and fresh converts the amount the recipe has (was KNOWN ISSUE H)', () => {
    for (const style of BREAD_STYLES.filter((s) => s.yeastType === 'instant')) {
      for (const to of ['active-dry', 'fresh'] as const) {
        const state = styleState(style.id);
        applyYeastType(state, to);
        expect(state.yeastType).toBe(to);
        // Kept to two decimals, so at most half a hundredth from the exact ratio.
        expect(Math.abs(state.yeastPercent - style.yeastPercent * YEAST_CONVERSIONS[to]), `${style.id}: instant ${style.yeastPercent}% to ${to} gave ${state.yeastPercent}%`).toBeLessThanOrEqual(0.0051);
      }
    }
  });

  it('No-Knead: 0.25% instant is 0.31% active dry or 0.75% fresh, and switching back lands on 0.25%', () => {
    const state = styleState('no-knead');
    applyYeastType(state, 'active-dry');
    expect(state.yeastPercent).toBe(0.31);
    applyYeastType(state, 'instant');
    expect(state.yeastPercent).toBe(0.25);
    applyYeastType(state, 'fresh');
    expect(state.yeastPercent).toBe(0.75);
    applyYeastType(state, 'instant');
    expect(state.yeastPercent).toBe(0.25);
  });

  it('picking the type already in use leaves the amount alone', () => {
    const state = styleState('baguette', { yeastPercent: 0.8 });
    applyYeastType(state, 'instant');
    expect(state.yeastPercent).toBe(0.8);
  });

  it('switching to or from a sourdough starter uses the style default instead of converting', () => {
    // A starter style has no yeast amount of its own, so yeast starts at the usual 1% instant.
    const sourdough = styleState('sourdough', { yeastPercent: 35 });
    applyYeastType(sourdough, 'active-dry');
    expect(sourdough).toMatchObject({ yeastType: 'active-dry', yeastPercent: DEFAULT_YEAST_PERCENT['active-dry'] });
    applyYeastType(sourdough, 'starter');
    expect(sourdough).toMatchObject({ yeastType: 'starter', yeastPercent: 20 });

    // A yeast style goes to the usual 20% starter, and comes back to its own amount.
    const baguette = styleState('baguette', { yeastPercent: 2 });
    applyYeastType(baguette, 'starter');
    expect(baguette).toMatchObject({ yeastType: 'starter', yeastPercent: DEFAULT_YEAST_PERCENT.starter });
    applyYeastType(baguette, 'fresh');
    expect(baguette).toMatchObject({ yeastType: 'fresh', yeastPercent: 1.5 });
  });

  it('the yeast slider reaches every converted amount', () => {
    expect(yeastSliderRange('instant')).toEqual({ min: 0.1, max: 3, step: 0.01 });
    expect(yeastSliderRange('active-dry')).toEqual({ min: 0.13, max: 3.75, step: 0.01 });
    expect(yeastSliderRange('fresh')).toEqual({ min: 0.3, max: 9, step: 0.01 });
    expect(yeastSliderRange('starter')).toEqual({ min: 10, max: 40, step: 1 });
  });
});

describe('8. water temperature', () => {
  it('a straight yeast dough uses the three-factor formula, DDT x 3 - room - flour - friction', () => {
    for (const ddt of [68, 75, 86]) {
      for (const roomTemp of [60, 70, 90]) {
        for (const flourTemp of [55, 70, 85]) {
          for (const frictionFactor of [11, 22, 32]) {
            for (const yeastType of ['instant', 'active-dry', 'fresh'] as const) {
              const state = stateWith({ ddt, roomTemp, flourTemp, frictionFactor, yeastType, yeastPercent: 1 });
              expect(calculateWaterTemp(state)).toBe(ddt * 3 - roomTemp - flourTemp - frictionFactor);
            }
          }
        }
      }
    }
  });

  it('a starter or a preferment adds the fourth factor, counted at room temperature (J1)', () => {
    for (const ddt of [68, 76, 86]) {
      for (const roomTemp of [60, 70, 90]) {
        for (const flourTemp of [55, 70, 85]) {
          for (const frictionFactor of [11, 22, 32]) {
            const four = ddt * 4 - roomTemp - flourTemp - roomTemp - frictionFactor;
            expect(calculateWaterTemp(stateWith({ ddt, roomTemp, flourTemp, frictionFactor }))).toBe(four);
            for (const prefermentType of ['poolish', 'biga', 'pate-fermentee', 'levain'] as const) {
              expect(calculateWaterTemp(stateWith({ ddt, roomTemp, flourTemp, frictionFactor, prefermentType, yeastType: 'instant', yeastPercent: 1 }))).toBe(four);
            }
          }
        }
      }
    }
    // The audit's example: defaults at 75°F, room and flour at 70°F, by hand. Was 74°F.
    expect(calculateWaterTemp(stateWith({ ddt: 75 }))).toBe(79);
  });

  it('Sourdough has one water temperature, on load and after picking its card (was V: 74°F, then 77°F)', () => {
    expect(createDefaultState().ddt).toBe(STYLE_DDT_DEFAULTS.sourdough);
    expect(calculateWaterTemp(createDefaultState())).toBe(calculateWaterTemp(styleState('sourdough')));
    expect(calculateWaterTemp(createDefaultState())).toBe(83);
  });

  it('warns below 40°F and above 110°F', () => {
    expect(waterTempWarningText(39)).toContain('too cold');
    expect(waterTempWarningText(40)).toBeNull();
    expect(waterTempWarningText(110)).toBeNull();
    expect(waterTempWarningText(111)).toContain('too hot');
  });

  /** The worked formula as numbers: desired dough temperature, how many factors, what comes off, and the result. */
  const worked = (state: RecipeState) => {
    const text = waterTempFormulaText(state, calculateWaterTemp(state));
    const [ddt, factors, ...rest] = text.split('. ')[0].match(/\d+(?:\.\d+)?/g)!.map(Number);
    return { text, ddt, factors, minus: rest.slice(0, -1), result: rest[rest.length - 1] };
  };
  const mixes = (): RecipeState[] =>
    [11, 22, 32].flatMap((frictionFactor) => [
      stateWith({ frictionFactor }),
      stateWith({ frictionFactor, yeastType: 'instant', yeastPercent: 1 }),
      stateWith({ frictionFactor, yeastType: 'instant', yeastPercent: 1, prefermentType: 'poolish', ddt: 86, roomTemp: 61, flourTemp: 57 }),
    ]);

  it('the worked formula adds up in Fahrenheit, with three factors or four', () => {
    for (const state of mixes()) {
      const w = worked(state);
      expect(w.factors).toBe(state.yeastType === 'starter' || state.prefermentType !== 'none' ? 4 : 3);
      expect(w.minus.length).toBe(w.factors);
      expect(w.ddt * w.factors - w.minus.reduce((a, b) => a + b, 0), w.text).toBe(w.result);
    }
    expect(worked(stateWith()).text).toBe('(76 × 4) - 70 - 70 - 70 - 11 = 83°F. Your starter is counted at room temperature.');
    expect(worked(stateWith({ yeastType: 'instant', yeastPercent: 1 })).text).toBe('(76 × 3) - 70 - 70 - 11 = 77°F');
  });

  it('the worked formula adds up in Celsius too (was KNOWN ISSUE I: "- -12 = 23°C")', () => {
    for (const base of mixes()) {
      const w = worked({ ...base, tempUnit: 'C' });
      // One decimal on each number, so the working is right to within a few tenths.
      expect(Math.abs(w.ddt * w.factors - w.minus.reduce((a, b) => a + b, 0) - w.result), w.text).toBeLessThanOrEqual(0.45);
      expect(w.text).not.toContain('- -');
    }
    expect(worked(stateWith({ tempUnit: 'C', yeastType: 'instant', yeastPercent: 1 })).text).toBe('(24.4 × 3) - 21.1 - 21.1 - 6.1 = 25°C');
  });

  it('the friction factor shown in Celsius is a difference: 11°F is 6°C (was KNOWN ISSUE I)', () => {
    expect(formatTempDifference(stateWith({ tempUnit: 'C' }), 11)).toBe('6°C');
    expect(formatTempDifference(stateWith({ tempUnit: 'C' }), 22)).toBe('12°C');
    expect(formatTempDifference(stateWith(), 11)).toBe('11°F');
    // A temperature still converts the usual way.
    expect(formatTemp(stateWith({ tempUnit: 'C' }), 76)).toBe('24°C');
  });

  it('active dry yeast gets a bloom note, and no other yeast does (J3)', () => {
    expect(yeastBloomNote(stateWith({ yeastType: 'active-dry', yeastPercent: 1.25 }))).toContain('100-110°F (38-43°C)');
    for (const yeastType of ['starter', 'instant', 'fresh'] as const) expect(yeastBloomNote(stateWith({ yeastType }))).toBeNull();
    expect(yeastBloomNote(stateWith({ yeastType: 'active-dry' }))).not.toMatch(/[–—]|--/);
  });

  it('no style states a water temperature of its own, so nothing disagrees with the card (J3)', () => {
    for (const style of BREAD_STYLES) {
      expect(Object.keys(style), style.id).not.toContain('waterTemp');
      expect(style.instructions.join(' '), style.id).not.toMatch(/warm water|°[FC] water|water at \d/i);
    }
  });
});

describe('9. timing and schedule', () => {
  const ranges = (state: RecipeState) => {
    const t = estimateFermentationTimes(state);
    return [t.bulk, t.proof, t.total].map((text) => {
      const m = text.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?) (hrs|min)$/);
      expect(m, text).not.toBeNull();
      return { text, min: Number(m![1]), max: Number(m![2]), unit: m![3] };
    });
  };
  const everyTimingState = function* (): Generator<RecipeState> {
    for (const ddt of [68, 70, 73, 75, 76, 78, 80, 86]) {
      for (const [yeastType, yeastPercent] of [['starter', 20], ['instant', 0.25], ['instant', 1], ['active-dry', 1.25], ['fresh', 3]] as const) {
        yield stateWith({ ddt, yeastType, yeastPercent });
      }
    }
  };

  it('every estimate is a real range with the low end first', () => {
    for (const state of everyTimingState()) {
      for (const r of ranges(state)) expect(r.min, r.text).toBeLessThanOrEqual(r.max);
    }
  });

  it('FLAGGED: base times at 75°F are 4-6 h bulk for a starter, 12-18 h under 0.5% yeast, and one short range for any other yeast amount', () => {
    expect(estimateFermentationTimes(stateWith({ ddt: 75 })).total).toBe('5-8 hrs');
    expect(estimateFermentationTimes(stateWith({ ddt: 75 })).bulk).toBe('4-6 hrs');
    expect(estimateFermentationTimes(stateWith({ ddt: 75, yeastType: 'instant', yeastPercent: 0.4 })).bulk).toBe('12-18 hrs');
    const half = estimateFermentationTimes(stateWith({ ddt: 75, yeastType: 'instant', yeastPercent: 0.5 }));
    const three = estimateFermentationTimes(stateWith({ ddt: 75, yeastType: 'instant', yeastPercent: 3 }));
    expect(half).toEqual(three);
    // The 0.5% line is not converted by yeast type: 0.6% fresh (about 0.2% instant) gets the short time.
    expect(estimateFermentationTimes(stateWith({ ddt: 75, yeastType: 'fresh', yeastPercent: 0.6 }))).toEqual(half);
  });

  it('FLAGGED: 5°F warmer shortens every time by 7%', () => {
    const at = (ddt: number) => estimateFermentationTimes(stateWith({ ddt, yeastType: 'instant', yeastPercent: 0.25 })).bulk;
    expect(at(75)).toBe('12-18 hrs');
    expect(at(80)).toBe(`${(12 * 0.93).toFixed(0)}-${(18 * 0.93).toFixed(0)} hrs`);
  });

  it('a time range never shows the same number twice, like "2-2 hrs" (was KNOWN ISSUE L)', () => {
    for (const state of everyTimingState()) {
      for (const r of ranges(state)) expect(r.min, `${state.yeastType} ${state.yeastPercent}% at ${state.ddt}°F: ${r.text}`).toBeLessThan(r.max);
    }
  });

  it('time ranges are rounded to a quarter hour and keep one unit (was "2-2 hrs", "43-86 min", "59-118 min")', () => {
    // The three the audit quoted: Baguette bulk, Sandwich proof, Sourdough proof at 76°F.
    expect(estimateFermentationTimes(styleState('baguette')).bulk).toBe('1.5-2 hrs');
    expect(estimateFermentationTimes(styleState('sandwich')).proof).toBe('45-90 min');
    expect(estimateFermentationTimes(styleState('sourdough')).proof).toBe('1-2 hrs');
    expect(formatHourRange(1.9, 2.1)).toBe('2-2.25 hrs');
    expect(formatHourRange(0.72, 1.43)).toBe('45-90 min');
    expect(formatHourRange(3.94, 5.91)).toBe('4-6 hrs');
    expect(formatHourRange(11.16, 16.74)).toBe('11-17 hrs');
    for (const state of everyTimingState()) {
      for (const r of ranges(state)) {
        const quarterHours = r.unit === 'min' ? [r.min / 15, r.max / 15] : [r.min * 4, r.max * 4];
        for (const q of quarterHours) expect(Number.isInteger(q), r.text).toBe(true);
      }
    }
  });

  const target = new Date('2026-03-14T09:00:00');
  const minutesOfDay = (text: string) => {
    const m = text.match(/^(\d+):(\d\d) (AM|PM)$/)!;
    return ((Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
  };
  const tasks = (state: RecipeState) => generateBakingSchedule(state, target).map((s) => s.task);

  it('works back from the serving time: cool for an hour, bake 45 minutes before that, preheat 45 before that', () => {
    const schedule = generateBakingSchedule(stateWith(), target);
    expect(schedule.slice(-3).map((s) => `${s.time} ${s.task}`)).toEqual(['6:30 AM Preheat oven (with Dutch oven)', '7:15 AM Bake bread', '8:00 AM Cool on wire rack']);
    expect(schedule[0].task).toBe('Mix final dough');
  });

  it('puts the preferment first and adds the fridge steps for a cold retard', () => {
    expect(tasks(stateWith({ prefermentType: 'biga' }))[0]).toBe('Mix Biga');
    expect(tasks(stateWith({ coldRetard: true }))).toEqual(expect.arrayContaining(['Shape & refrigerate overnight', 'Remove from fridge, let warm']));
    expect(tasks(stateWith({ coldRetard: true }))).not.toContain('Shape and final proof');
  });

  it('the bulk slot follows the yeast: 5 h for a starter, 15 h under 0.5% yeast, 2 h otherwise', () => {
    const bulkHours = (state: RecipeState) => {
      const s = generateBakingSchedule(state, target);
      const i = s.findIndex((x) => x.task.startsWith('Bulk fermentation'));
      return (((minutesOfDay(s[i + 1].time) - minutesOfDay(s[i].time)) % 1440) + 1440) % 1440 / 60;
    };
    expect(bulkHours(styleState('sourdough'))).toBe(5);
    expect(bulkHours(styleState('no-knead'))).toBe(15);
    expect(bulkHours(styleState('baguette'))).toBe(2);
  });

  it('FLAGGED: the schedule steps are the same for every style, Dutch oven preheat included', () => {
    const sourdough = tasks(styleState('sourdough'));
    for (const style of BREAD_STYLES) expect(tasks(styleState(style.id)), style.id).toEqual(sourdough);
    expect(sourdough).toContain('Preheat oven (with Dutch oven)');
  });

  it('the autolyse rest comes before the final mix (was KNOWN ISSUE M)', () => {
    const schedule = generateBakingSchedule(stateWith({ autolyse: true, autolyseDuration: 30 }), target);
    const order = schedule.map((s) => s.task);
    expect(order.indexOf('Autolyse (flour + water rest)')).toBe(order.indexOf('Mix final dough') - 1);
    expect(order.indexOf('Mix final dough')).toBe(order.indexOf('Bulk fermentation (stretch & fold)') - 1);
    // Sourdough, ready at 9:00 AM: bulk at midnight, mix a quarter hour before, autolyse 30 minutes before that.
    expect(schedule.slice(0, 3).map((s) => s.time)).toEqual(['11:15 PM', '11:45 PM', '12:00 AM']);
  });

  it('each calendar event runs until the next step starts', () => {
    const schedule = generateBakingSchedule(stateWith(), target);
    const ics = scheduleIcs(schedule, target);
    const stamps = (key: string) => [...ics.matchAll(new RegExp(`${key}:(\\d{8}T\\d{6}Z)`, 'g'))].map((m) => m[1]);
    expect(stamps('DTEND').slice(0, -1)).toEqual(stamps('DTSTART').slice(1));
    expect(stamps('DTEND').at(-1)).toBe(target.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
    expect(stamps('DTSTART')).toEqual(schedule.map((s) => s.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'));
  });

  it('the calendar file puts each step at the time the schedule shows (was KNOWN ISSUE M)', () => {
    const schedule = generateBakingSchedule(stateWith(), target);
    const starts = [...scheduleIcs(schedule, target).matchAll(/DTSTART:(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z/g)].map((m) =>
      formatScheduleTime(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]))),
    );
    expect(starts).toEqual(schedule.map((s) => s.time));
  });
});

describe('other printed outputs', () => {
  it.fails('KNOWN ISSUE R: the copied recipe lists every row the card lists', () => {
    const state = stateWith({ prefermentType: 'poolish' });
    const p = printed(state);
    const text = recipeCopyText(state, p.recipe);
    for (const r of p.rows) expect(text, `${r.name} ${r.weight}g`).toContain(`${r.weight}g`);
  });

  it.fails('KNOWN ISSUE R: the copied recipe says "1 loaf", not "1 loaves"', () => {
    const state = stateWith({ numLoaves: 1 });
    expect(recipeCopyText(state, printed(state).recipe)).not.toContain('1 loaves');
  });
});

describe('page wiring that changes the numbers (checked in the page source)', () => {
  const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');

  it('the flour Quick Blends and schedule buttons are not also dough quantity presets (was KNOWN ISSUE N)', () => {
    // They share the .preset-pill look. The quantity presets used to listen on every
    // .preset-pill and read data-loaves and data-weight, which those buttons do not carry, so
    // a click on one reset the dough to 2 loaves x 900 g.
    expect(src).toContain("const quantityPresets = document.querySelectorAll('.preset-pill[data-loaves][data-weight]');");
    expect(src).not.toContain("document.querySelectorAll('.preset-pill')");
    const pills = [...src.matchAll(/<button class="([^"]*\bpreset-pill\b[^"]*)"([^>]*)>/g)];
    expect(pills.length).toBe(9);
    for (const [, classes, attributes] of pills) {
      const isQuantity = /data-loaves="\d+" data-weight="\d+"/.test(attributes);
      expect(isQuantity, classes).toBe(!/(flour|schedule)-preset-btn/.test(classes));
    }
  });

  it('the hydration slider covers the 50 to 95 that links accept (was W: 55 to 90)', () => {
    expect([HYDRATION_MIN, HYDRATION_MAX]).toEqual([50, 95]);
    expect(src).toContain('id="hydration-slider" min={HYDRATION_MIN} max={HYDRATION_MAX}');
    for (const style of BREAD_STYLES) {
      expect(style.hydration, style.id).toBeGreaterThanOrEqual(HYDRATION_MIN);
      expect(style.hydration, style.id).toBeLessThanOrEqual(HYDRATION_MAX);
    }
  });

  it('the effective hydration box is refreshed whenever the recipe is (was KNOWN ISSUE O)', () => {
    const updateUI = src.slice(src.indexOf('function updateUI() {'), src.indexOf('// Update yeast type button active states'));
    expect(updateUI).toContain('updateEnrichmentDisplay()');
  });

  it('the highlighted autolyse length is the one the schedule uses (was KNOWN ISSUE U)', () => {
    const active = src.match(/autolyse-duration-btn autolyse-duration-active" data-duration="(\d+)"/)!;
    expect(Number(active[1])).toBe(createDefaultState().autolyseDuration);
  });
});
