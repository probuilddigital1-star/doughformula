import { describe, it, expect } from 'vitest';
import { hydrationView, HYDRATION_DEFAULTS, type HydrationInputs } from '../../src/lib/hydration-view';
import { percentagesToGramsView, recipeToPercentagesView, saltView, type RowInput } from '../../src/lib/bakers-view';
import { DASH, parseInput } from '../../src/lib/calculator-display';
import { HANDOFF_FALLBACK } from '../../src/lib/handoff';

const hv = (over: Partial<HydrationInputs>, mode: Parameters<typeof hydrationView>[0] = 'water-from-flour') =>
  hydrationView(mode, { ...HYDRATION_DEFAULTS, ...over });

describe('parseInput', () => {
  it('treats empty and non-numeric text as missing, and keeps real zeros', () => {
    expect(parseInput('')).toBeNaN();
    expect(parseInput('  ')).toBeNaN();
    expect(parseInput('abc')).toBeNaN();
    expect(parseInput('0')).toBe(0);
    expect(parseInput('72.5')).toBe(72.5);
  });
});

describe('hydration calculator display', () => {
  it('shows the defaults with units', () => {
    const { values } = hv({});
    expect(values['wf-water']).toBe('375 g');
    expect(values['hr-hydration']).toBe('70%');
    expect(values['hr-starter-flour']).toBe('50 g');
    expect(values['hr-starter-water']).toBe('50 g');
    expect(values['hr-total-flour']).toBe('500 g');
    expect(values['hr-total-water']).toBe('350 g');
    expect(values['sd-flour']).toBe('514 g');
    expect(values['sd-water']).toBe('386 g');
  });

  it('Hydration from a recipe: a dash for every result when flour is empty or zero', () => {
    for (const flour of ['', '0']) {
      const v = hv({ 'hr-flour': flour }, 'hydration-from-recipe');
      for (const id of ['hr-hydration', 'hr-starter-flour', 'hr-starter-water', 'hr-total-flour', 'hr-total-water']) {
        expect(v.values[id], `${id} with flour "${flour}"`).toBe(DASH);
      }
      expect(v.handoff).toBe(HANDOFF_FALLBACK);
    }
  });

  it('Hydration from a recipe: dashes when water is empty, but an empty starter just means none', () => {
    expect(hv({ 'hr-water': '' }, 'hydration-from-recipe').values['hr-hydration']).toBe(DASH);
    const noStarter = hv({ 'hr-starter': '', 'hr-starter-h': '' }, 'hydration-from-recipe').values;
    expect(noStarter['hr-hydration']).toBe('66.7%');
    expect(noStarter['hr-starter-flour']).toBe('0 g');
    expect(hv({ 'hr-starter-h': '' }, 'hydration-from-recipe').values['hr-hydration']).toBe(DASH);
  });

  it('Water from flour: a dash when flour is empty or zero, or hydration is empty; 0% hydration is a real 0 g', () => {
    expect(hv({ 'wf-flour': '' }).values['wf-water']).toBe(DASH);
    expect(hv({ 'wf-flour': '0' }).values['wf-water']).toBe(DASH);
    expect(hv({ 'wf-hydration': '' }).values['wf-water']).toBe(DASH);
    expect(hv({ 'wf-hydration': '0' }).values['wf-water']).toBe('0 g');
    expect(hv({ 'wf-flour': '' }).handoff).toBe(HANDOFF_FALLBACK);
  });

  it('Split a dough weight: a dash when the total is empty or zero, or hydration is empty', () => {
    for (const over of [{ 'sd-total': '' }, { 'sd-total': '0' }, { 'sd-hydration': '' }]) {
      const v = hv(over, 'split-dough-weight');
      expect(v.values['sd-flour']).toBe(DASH);
      expect(v.values['sd-water']).toBe(DASH);
      expect(v.handoff).toBe(HANDOFF_FALLBACK);
    }
  });
});

describe("baker's percentage calculator display", () => {
  const rows = (amounts: string[]): RowInput[] =>
    (['flour', 'water', 'other', 'starter'] as const).map((kind, i) => ({ name: kind, kind, amount: amounts[i] }));

  it('shows the default recipe', () => {
    const v = recipeToPercentagesView(rows(['500', '350', '10', '100']));
    expect(v.outs).toEqual(['100%', '70%', '2%', '20%']);
    expect(v.flourTotal).toBe('500 g (100%)');
    expect(v.doughTotal).toBe('960 g');
  });

  it('Recipe to percentages: every percent is a dash without flour', () => {
    for (const flour of ['', '0']) {
      const v = recipeToPercentagesView(rows([flour, '350', '10', '100']));
      expect(v.outs).toEqual([DASH, DASH, DASH, DASH]);
      expect(v.flourTotal).toBe(DASH);
      expect(v.handoff).toBe(HANDOFF_FALLBACK);
    }
  });

  it('Recipe to percentages: an empty row shows a dash and the others still compute', () => {
    const v = recipeToPercentagesView(rows(['500', '', '10', '100']));
    expect(v.outs).toEqual(['100%', DASH, '2%', '20%']);
    expect(v.doughTotal).toBe('610 g');
  });

  it('Recipe to percentages: all rows empty gives dashes everywhere', () => {
    const v = recipeToPercentagesView(rows(['', '', '', '']));
    expect(v.doughTotal).toBe(DASH);
  });

  it('Percentages to grams: grams are dashes without a flour weight', () => {
    for (const flour of ['', '0']) {
      const v = percentagesToGramsView(flour, rows(['100', '70', '2', '20']));
      expect(v.outs).toEqual([DASH, DASH, DASH, DASH]);
      expect(v.doughTotal).toBe(DASH);
      expect(v.flourTotal).toBe('100%');
      expect(v.handoff).toBe(HANDOFF_FALLBACK);
    }
  });

  it('Percentages to grams: an empty percent shows a dash for that row only', () => {
    const v = percentagesToGramsView('500', rows(['100', '', '2', '20']));
    expect(v.outs).toEqual(['500 g', DASH, '10 g', '100 g']);
  });

  it('Percentages to grams: hands off the grams it shows', () => {
    const v = percentagesToGramsView('1000', rows(['100', '70', '2', '20']));
    expect(v.outs).toEqual(['1000 g', '700 g', '20 g', '200 g']);
    expect(v.handoff).toBe('/?loaves=1&weight=1920&hydration=70#calculator');
  });

  it('salt: grams, or a dash when flour or percent is missing', () => {
    expect(saltView('500', '2.0')).toBe('10 g');
    expect(saltView('', '2.0')).toBe(DASH);
    expect(saltView('0', '2.0')).toBe(DASH);
    expect(saltView('500', '')).toBe(DASH);
  });
});
