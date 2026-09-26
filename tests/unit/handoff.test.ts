import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HANDOFF_FALLBACK, HOMEPAGE_SALT_PCT, HOMEPAGE_STARTER_PCT, handoffHref } from '../../src/lib/handoff';
import { hydrationView, HYDRATION_DEFAULTS } from '../../src/lib/hydration-view';
import { recipeToPercentagesView } from '../../src/lib/bakers-view';
import { DEFAULT_ROWS } from '../../src/lib/bakers-percentage';

/**
 * What the homepage calculator builds from a hand-off URL: loadFromURL() reads loaves, weight
 * and hydration (50 to 95 only), then calculateRecipe() in src/pages/index.astro does
 *   flour = round(loaves × weight / (1 + h/100 + salt/100 + starter/100))
 *   water = round(flour × h / 100)
 * with the default Sourdough style's salt and starter. The drift guard below keeps this
 * copy honest.
 */
function homepageRecipe(href: string): { flour: number; water: number; hydration: number } {
  const params = new URL(href, 'https://thedoughformula.com').searchParams;
  const loaves = parseInt(params.get('loaves') || '2');
  const weight = parseInt(params.get('weight') || '900');
  const hRaw = parseFloat(params.get('hydration') || '75');
  const h = !isNaN(hRaw) && hRaw >= 50 && hRaw <= 95 ? hRaw : 75;
  const flour = Math.round((loaves * weight) / (1 + h / 100 + HOMEPAGE_SALT_PCT / 100 + HOMEPAGE_STARTER_PCT / 100));
  return { flour, water: Math.round((flour * h) / 100), hydration: h };
}

const within2 = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(2);

describe('homepage calculator contract (drift guard)', () => {
  const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');

  it('still derives flour from total dough, hydration, salt and starter percentages', () => {
    expect(src).toContain('const totalDough = state.numLoaves * state.loafWeight;');
    expect(src).toContain(
      'const flourWeight = Math.round(totalDough / (1 + state.hydration / 100 + state.salt / 100 + yeastContribution));',
    );
    expect(src).toContain('let waterWeight = Math.round(flourWeight * state.hydration / 100);');
  });

  it('still starts on Sourdough with the salt and starter percentages the hand-off assumes', () => {
    const state = src.slice(src.indexOf('const state: RecipeState = {'), src.indexOf('};', src.indexOf('const state: RecipeState = {')));
    expect(state).toContain("style: 'sourdough'");
    expect(state).toContain(`salt: ${HOMEPAGE_SALT_PCT},`);
    expect(state).toContain("yeastType: 'starter'");
    expect(state).toContain(`yeastPercent: ${HOMEPAGE_STARTER_PCT},`);
    expect(state).toContain("prefermentType: 'none'");
  });

  it('still reads loaves, weight and hydration (50 to 95) from the URL', () => {
    expect(src).toContain("state.numLoaves = parseInt(params.get('loaves') || '2');");
    expect(src).toContain("state.loafWeight = parseInt(params.get('weight') || '900');");
    expect(src).toContain('if (!isNaN(h) && h >= 50 && h <= 95) {');
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
