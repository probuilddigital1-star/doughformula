import { beforeAll, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BREAD_STYLES,
  DEFAULT_YEAST_PERCENT,
  YEAST_CONVERSIONS,
  applyStyle,
  applyUrlRecipeParams,
  applyYeastType,
  calculateWaterTemp,
  calculateWholeGrainPercent,
  createDefaultState,
  estimateFermentationTimes,
  formatScheduleTime,
  formatTemp,
  formatWeight,
  generateBakingSchedule,
  parseUrlRecipeParams,
  recipeCopyText,
  scheduleIcs,
  waterTempFormulaText,
  waterTempWarningText,
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
    // 8 styles x 4 basics x 18 yeast settings x 13 preferment settings x 5 sizes x 9 enrichment sets
    expect(SWEEP_SIZE).toBe(8 * 4 * 18 * 13 * 5 * 9);
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
      expectOnlyKnown(sweep.percentages, [/^(flour|Water) row, with /]);
    });

    it.fails('KNOWN ISSUE C: flour and water percentages still match their grams when a preferment is on', () => {
      expectClean(sweep.percentages, /^(flour|Water) row, with /);
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

    it.fails('KNOWN ISSUE Q: a junk or negative loaf count in the link cannot reach the recipe', () => {
      for (const query of ['loaves=abc', 'loaves=-2', 'weight=-900']) {
        const state = createDefaultState();
        applyUrlRecipeParams(state, parseUrlRecipeParams(new URLSearchParams(query)));
        for (const r of printed(state).rows) {
          expect(Number.isFinite(r.weight), `?${query}: ${r.name} ${formatWeight(state, r.weight)}`).toBe(true);
          expect(r.weight, `?${query}: ${r.name} ${formatWeight(state, r.weight)}`).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it.fails('KNOWN ISSUE T: a flour blend that adds up past 100% cannot print negative flour', () => {
      // The Flour tab warns "Total flour must equal 100%" and still prints the recipe.
      const blend = [{ type: 'bread', percent: 100 }, { type: 'whole-wheat', percent: 100 }, { type: 'rye-light', percent: 50 }];
      const p = printed(stateWith({ wholeGrain: calculateWholeGrainPercent(blend) }), undefined, blend);
      for (const r of p.rows) expect(r.weight, `${r.name} ${r.weight} g`).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. preferment flour and water are taken out of the main rows exactly once', () => {
    it('holds for every preferment type and amount', () => {
      expectClean(sweep.preferment, 'flour or water not removed exactly once');
      expectClean(sweep.preferment, 'preferment row is not its flour plus water');
      expectClean(sweep.preferment, 'rows differ from the recipe without a preferment');
      expectOnlyKnown(sweep.preferment, [/ box weighs more than the "All of the" row$/, 'pate-fermentee asks for instant yeast above 2% of its flour']);
    });

    it.fails('KNOWN ISSUE F: pâte fermentée never asks for instant yeast at a starter-sized dose', () => {
      expectClean(sweep.preferment, 'pate-fermentee asks for instant yeast above 2% of its flour');
    });

    it.fails('KNOWN ISSUE G: what the preferment box says to mix weighs what the "All of the ..." row says (within 2 g)', () => {
      expectClean(sweep.preferment, / box weighs more than the "All of the" row$/);
    });
  });

  describe('5. ounce values match the gram values', () => {
    it('every ounce value is its gram value converted, and the ounce rows stay within half an ounce of the ounce total', () => {
      expectClean(sweep.ounces, 'ounce value is not the gram value converted');
      expectClean(sweep.ounces, 'ounce rows drift from the ounce total');
      expectOnlyKnown(sweep.ounces, ['tenth of an ounce is too coarse (more than 10% off)', 'prints 0.0oz for a real amount']);
    });

    it.fails('KNOWN ISSUE E: a real amount never prints as 0.0oz', () => {
      expectClean(sweep.ounces, 'prints 0.0oz for a real amount');
    });

    it.fails('KNOWN ISSUE E: no ounce value is more than 10% away from its grams', () => {
      expectClean(sweep.ounces, 'tenth of an ounce is too coarse (more than 10% off)');
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
  it('FLAGGED: is the three-factor desired dough temperature formula, DDT x 3 - room - flour - friction', () => {
    // The standard method adds a fourth factor (the preferment or starter temperature) when
    // one is used. This calculator never does; see the audit.
    for (const ddt of [68, 75, 86]) {
      for (const roomTemp of [60, 70, 90]) {
        for (const flourTemp of [55, 70, 85]) {
          for (const frictionFactor of [11, 22, 32]) {
            for (const prefermentType of ['none', 'poolish', 'levain'] as const) {
              const state = stateWith({ ddt, roomTemp, flourTemp, frictionFactor, prefermentType });
              expect(calculateWaterTemp(state)).toBe(ddt * 3 - roomTemp - flourTemp - frictionFactor);
            }
          }
        }
      }
    }
  });

  it('warns below 40°F and above 110°F', () => {
    expect(waterTempWarningText(39)).toContain('too cold');
    expect(waterTempWarningText(40)).toBeNull();
    expect(waterTempWarningText(110)).toBeNull();
    expect(waterTempWarningText(111)).toContain('too hot');
  });

  /** The worked formula as numbers: [ddt, room, flour, friction, result]. */
  const formulaNumbers = (state: RecipeState) =>
    waterTempFormulaText(state, calculateWaterTemp(state)).match(/-?\d+/g)!.map(Number).filter((_, i) => i !== 1);

  it('the worked formula adds up in Fahrenheit', () => {
    for (const frictionFactor of [11, 22, 32]) {
      const [ddt, room, flour, friction, result] = formulaNumbers(stateWith({ frictionFactor }));
      expect(ddt * 3 - room - flour - friction).toBe(result);
    }
  });

  it.fails('KNOWN ISSUE I: the worked formula adds up in Celsius (within rounding)', () => {
    for (const frictionFactor of [11, 22, 32]) {
      const state = stateWith({ tempUnit: 'C', frictionFactor });
      const [ddt, room, flour, friction, result] = formulaNumbers(state);
      // Today: "(24 × 3) - 21 - 21 - -12 = 23°C". The friction factor is a temperature
      // difference, so 11°F of friction is 6°C, not -12°C. Whole degrees leave up to 3° of
      // rounding across the five numbers.
      expect(Math.abs(ddt * 3 - room - flour - friction - result), waterTempFormulaText(state, calculateWaterTemp(state))).toBeLessThanOrEqual(3);
    }
  });

  it.fails('KNOWN ISSUE I: the friction factor shown in Celsius is a difference (11°F is 6°C)', () => {
    expect(formatTemp(stateWith({ tempUnit: 'C' }), 11)).toBe('6°C');
  });
});

describe('9. timing and schedule', () => {
  const ranges = (state: RecipeState) => {
    const t = estimateFermentationTimes(state);
    return [t.bulk, t.proof, t.total].map((text) => {
      const m = text.match(/^(\d+)-(\d+) (hrs|min)$/);
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

  it.fails('KNOWN ISSUE L: a time range never shows the same number twice, like "2-2 hrs"', () => {
    for (const state of everyTimingState()) {
      for (const r of ranges(state)) expect(r.min, `${state.yeastType} ${state.yeastPercent}% at ${state.ddt}°F: ${r.text}`).toBeLessThan(r.max);
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

  it.fails('KNOWN ISSUE M: the autolyse rest comes before the final mix', () => {
    const order = tasks(stateWith({ autolyse: true }));
    expect(order.indexOf('Autolyse (flour + water rest)')).toBeLessThan(order.indexOf('Mix final dough'));
  });

  it.fails('KNOWN ISSUE M: the calendar file puts each step at the time the schedule shows', () => {
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

  it.fails('KNOWN ISSUE N: the flour Quick Blends buttons are not also dough quantity presets', () => {
    // The quantity presets listen on every .preset-pill and read data-loaves and data-weight.
    // The blend buttons carry that class with neither, so a click resets to 2 loaves x 900 g.
    expect(src).toContain("document.querySelectorAll('.preset-pill').forEach(pill => {");
    expect(src).not.toMatch(/class="flour-preset-btn preset-pill/);
  });

  it.fails('KNOWN ISSUE O: the effective hydration box is refreshed whenever the recipe is', () => {
    const updateUI = src.slice(src.indexOf('function updateUI() {'), src.indexOf('// Update yeast type button active states'));
    expect(updateUI).toContain('updateEnrichmentDisplay()');
  });

  it.fails('KNOWN ISSUE U: the highlighted autolyse length is the one the schedule uses', () => {
    const active = src.match(/autolyse-duration-btn autolyse-duration-active" data-duration="(\d+)"/)!;
    expect(Number(active[1])).toBe(createDefaultState().autolyseDuration);
  });
});
