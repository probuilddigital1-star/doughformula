import { describe, it, expect } from 'vitest';
import { allCombos, STYLE_META } from '../../src/data/recipes';
import { computeSchedule, composeMethod } from '../../src/lib/recipe-formula';

describe('Challenger gear mention in the schedule', () => {
  it('flags exactly one step, the bake step, on every Dutch oven combo', () => {
    for (const c of allCombos().filter((c) => STYLE_META[c.style].shapeFamily === 'dutch-oven')) {
      const steps = computeSchedule(c);
      const flagged = steps.filter((s) => s.gearMention === 'challenger');
      expect(flagged, JSON.stringify(c)).toHaveLength(1);
      expect(flagged[0]).toBe(steps[steps.length - 1]);
      expect(flagged[0].action).toMatch(/^Score the loaf\. Bake at \d+°F covered/);
    }
  });

  it('flags nothing for other families', () => {
    for (const c of allCombos().filter((c) => STYLE_META[c.style].shapeFamily !== 'dutch-oven')) {
      expect(computeSchedule(c).some((s) => s.gearMention), JSON.stringify(c)).toBe(false);
    }
  });

  it('keeps the mention out of the step text and the method (Recipe JSON-LD)', () => {
    for (const c of allCombos()) {
      for (const s of computeSchedule(c)) expect(s.action).not.toContain('Challenger');
      for (const m of composeMethod(c)) expect(m.text).not.toContain('Challenger');
    }
  });
});
