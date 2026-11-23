import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HANDOFF_FALLBACK, HOMEPAGE_SALT_PCT, HOMEPAGE_STARTER_PCT, handoffHref } from '../../src/lib/handoff';
import { hydrationView, HYDRATION_DEFAULTS } from '../../src/lib/hydration-view';
import { recipeToPercentagesView } from '../../src/lib/bakers-view';
import { DEFAULT_ROWS } from '../../src/lib/bakers-percentage';
import {
  BREAD_STYLES,
  applyUrlRecipeParams,
  calculateRecipe,
  createDefaultEnrichments,
  createDefaultFlourBlend,
  createDefaultState,
  ingredientRows,
  parseUrlRecipeParams,
} from '../../src/lib/bread-calculator';

/**
 * What the homepage calculator prints for a hand-off URL, using the calculator's own code
 * (src/lib/bread-calculator.ts), in the order src/pages/index.astro runs it: loadFromURL()
 * reads the URL with parseUrlRecipeParams() and applyUrlRecipeParams(), then updateUI() prints
 * the rows ingredientRows() builds from calculateRecipe(). The flour and water returned here
 * are the printed rows, so this fails if either the math or the printed list moves.
 */
function homepageRecipe(href: string): { flour: number; water: number; hydration: number } {
  const state = createDefaultState();
  applyUrlRecipeParams(state, parseUrlRecipeParams(new URL(href, 'https://thedoughformula.com').searchParams));
  const enrichments = createDefaultEnrichments();
  const recipe = calculateRecipe(state, enrichments, createDefaultFlourBlend());
  const rows = ingredientRows(state, enrichments, recipe);
  const grams = (match: (name: string) => boolean) => rows.filter((r) => match(r.name)).reduce((sum, r) => sum + r.weight, 0);
  return { flour: grams((n) => n.endsWith('Flour')), water: grams((n) => n === 'Water'), hydration: state.hydration };
}

const within2 = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(2);

describe('homepage calculator contract (drift guard)', () => {
  const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');

  it('the homepage runs the shared calculator code that these tests run, not its own copy', () => {
    expect(src).toContain("import * as calc from '../lib/bread-calculator';");
    expect(src).toContain('const state: RecipeState = calc.createDefaultState();');
    expect(src).toContain('const calculateRecipe = () => calc.calculateRecipe(state, enrichmentState, flourBlend);');
    expect(src).toContain('const ingredients = calc.ingredientRows(state, enrichmentState, recipe);');
    expect(src).toContain('const fromUrl = calc.parseUrlRecipeParams(new URLSearchParams(window.location.search));');
    expect(src).toContain('calc.applyUrlRecipeParams(state, fromUrl);');
    // No recipe math left inline in the page.
    expect(src).not.toContain('state.numLoaves * state.loafWeight');
    expect(src).not.toMatch(/Math\.round\(\s*(totalDough|flourWeight)/);
  });

  it('still derives flour from total dough, hydration, salt and starter percentages', () => {
    for (const [loaves, weight] of [[1, 849], [1, 1900], [2, 900], [2, 1970], [3, 1733], [12, 2000]]) {
      for (const hydration of [50, 66.7, 68, 75, 95]) {
        const state = { ...createDefaultState(), numLoaves: loaves, loafWeight: weight, hydration };
        const recipe = calculateRecipe(state, createDefaultEnrichments(), createDefaultFlourBlend());
        const flour = Math.round((loaves * weight) / (1 + hydration / 100 + HOMEPAGE_SALT_PCT / 100 + HOMEPAGE_STARTER_PCT / 100));
        expect(recipe.totalDough).toBe(loaves * weight);
        expect(recipe.flourWeight, `${loaves} x ${weight} at ${hydration}%`).toBe(flour);
        expect(recipe.waterWeight, `${loaves} x ${weight} at ${hydration}%`).toBe(Math.round((flour * hydration) / 100));
      }
    }
  });

  it('still starts on Sourdough with the salt and starter percentages the hand-off assumes', () => {
    expect(createDefaultState()).toMatchObject({
      style: 'sourdough',
      numLoaves: 2,
      loafWeight: 900,
      hydration: 75,
      salt: HOMEPAGE_SALT_PCT,
      yeastType: 'starter',
      yeastPercent: HOMEPAGE_STARTER_PCT,
      prefermentType: 'none',
    });
    expect(createDefaultEnrichments()).toMatchObject({
      fat: { enabled: false },
      eggs: { enabled: false },
      dairy: { enabled: false },
      sweet: { enabled: false },
    });
    // The first style card is the one selected on load.
    expect(BREAD_STYLES[0]).toMatchObject({ id: 'sourdough', salt: HOMEPAGE_SALT_PCT, yeastType: 'starter', yeastPercent: HOMEPAGE_STARTER_PCT });
  });

  it('still reads loaves, weight and hydration (50 to 95) from the URL', () => {
    const read = (query: string) => parseUrlRecipeParams(new URLSearchParams(query));
    expect(read('loaves=3&weight=1234&hydration=66.7')).toEqual({ loaves: 3, weight: 1234, hydration: 66.7 });
    expect(read('hydration=50').hydration).toBe(50);
    expect(read('hydration=95').hydration).toBe(95);
    expect(read('hydration=49.9').hydration).toBeUndefined();
    expect(read('hydration=95.1').hydration).toBeUndefined();
    expect(read('hydration=abc').hydration).toBeUndefined();
    expect(read('')).toEqual({});

    const state = createDefaultState();
    applyUrlRecipeParams(state, read('loaves=1&weight=1900&hydration=68'));
    expect(state).toMatchObject({ numLoaves: 1, loafWeight: 1900, hydration: 68, salt: HOMEPAGE_SALT_PCT, yeastPercent: HOMEPAGE_STARTER_PCT });
  });
});

describe('handoffHref', () => {
  it('builds the weight forward from the flour so the homepage lands on it', () => {
    expect(handoffHref({ flour: 1000, hydration: 68 })).toBe('/?loaves=1&weight=1900&hydration=68#calculator');
    const r = homepageRecipe(handoffHref({ flour: 1000, hydration: 68 }));
    expect(r).toEqual({ flour: 1000, water: 680, hydration: 68 });
  });

  it('splits doughs over the 2000 g loaf field into more loaves without losing flour', () => {
    const href = handoffHref({ flour: 2000, hydration: 75 });
    expect(href).toBe('/?loaves=2&weight=1970&hydration=75#calculator');
    expect(homepageRecipe(href).flour).toBe(2000);
    for (const flour of [150, 333, 1234, 2600, 5000]) within2(homepageRecipe(handoffHref({ flour, hydration: 72 })).flour, flour);
  });

  it('clamps hydration to the 50 to 95 the homepage accepts, keeping the flour', () => {
    expect(handoffHref({ flour: 500, hydration: 40 })).toContain('hydration=50');
    expect(handoffHref({ flour: 500, hydration: 120 })).toContain('hydration=95');
    expect(homepageRecipe(handoffHref({ flour: 500, hydration: 120 })).flour).toBe(500);
  });

  it('falls back to the plain calculator link without a usable flour weight', () => {
    expect(handoffHref({ flour: 0, hydration: 70 })).toBe(HANDOFF_FALLBACK);
    expect(handoffHref({ flour: NaN, hydration: 70 })).toBe(HANDOFF_FALLBACK);
    expect(handoffHref({ flour: 500, hydration: NaN })).toBe(HANDOFF_FALLBACK);
  });
});

describe('hand-off acceptance cases: the homepage keeps the flour and water grams entered', () => {
  it('Water from flour, 1000 g at 68%: 1000 g flour, 680 g water', () => {
    const { handoff } = hydrationView('water-from-flour', { ...HYDRATION_DEFAULTS, 'wf-flour': '1000', 'wf-hydration': '68' });
    expect(handoff).toBe('/?loaves=1&weight=1900&hydration=68#calculator');
    const r = homepageRecipe(handoff);
    within2(r.flour, 1000);
    within2(r.water, 680);
  });

  it('Split a dough weight, 900 g at 75%: 514 g flour, 386 g water', () => {
    const { handoff } = hydrationView('split-dough-weight', { ...HYDRATION_DEFAULTS, 'sd-total': '900', 'sd-hydration': '75' });
    expect(handoff).toBe('/?loaves=1&weight=1013&hydration=75#calculator');
    const r = homepageRecipe(handoff);
    within2(r.flour, 514);
    within2(r.water, 386);
  });

  it("Baker's percentage default recipe: 500 g flour, 350 g water", () => {
    const rows = DEFAULT_ROWS.map((r) => ({ name: r.name, kind: r.kind, amount: String(r.grams) }));
    const { handoff } = recipeToPercentagesView(rows);
    expect(handoff).toBe('/?loaves=1&weight=960&hydration=70#calculator');
    const r = homepageRecipe(handoff);
    within2(r.flour, 500);
    within2(r.water, 350);
  });

  it('Hydration from a recipe, 450 flour, 300 water, 100 starter at 100%: 450 g flour, 300 g water', () => {
    const { handoff } = hydrationView('hydration-from-recipe', {
      ...HYDRATION_DEFAULTS,
      'hr-flour': '450',
      'hr-water': '300',
      'hr-starter': '100',
      'hr-starter-h': '100',
    });
    expect(handoff).toBe('/?loaves=1&weight=849&hydration=66.7#calculator');
    const r = homepageRecipe(handoff);
    within2(r.flour, 450);
    within2(r.water, 300);
  });
});
