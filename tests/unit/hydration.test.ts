import { describe, it, expect } from 'vitest';
import { roundG, roundPct, waterFromFlour, hydrationFromRecipe, splitDough } from '../../src/lib/hydration';

describe('rounding', () => {
  it('rounds grams to the gram and percents to one decimal', () => {
    expect(roundG(226.44)).toBe(226);
    expect(roundG(7.5)).toBe(8);
    expect(roundPct(64.705)).toBe(64.7);
    expect(roundPct(72.727)).toBe(72.7);
  });
});

describe('waterFromFlour', () => {
  it('multiplies flour by hydration', () => {
    expect(waterFromFlour(500, 75)).toBe(375);
    expect(waterFromFlour(333, 68)).toBe(226);
  });
  it('returns 0 for empty or invalid input', () => {
    expect(waterFromFlour(0, 75)).toBe(0);
    expect(waterFromFlour(NaN, 75)).toBe(0);
    expect(waterFromFlour(500, -5)).toBe(0);
  });
});

describe('hydrationFromRecipe', () => {
  it('handles a recipe without starter', () => {
    expect(hydrationFromRecipe({ flour: 500, water: 350 })).toEqual({
      hydration: 70, starterFlour: 0, starterWater: 0, totalFlour: 500, totalWater: 350,
    });
  });

  it('counts the flour and water inside a 100% starter', () => {
    expect(hydrationFromRecipe({ flour: 450, water: 300, starter: 100, starterHydration: 100 })).toEqual({
      hydration: 70, starterFlour: 50, starterWater: 50, totalFlour: 500, totalWater: 350,
    });
  });

  it('splits a stiff 50% starter correctly', () => {
    expect(hydrationFromRecipe({ flour: 450, water: 300, starter: 90, starterHydration: 50 })).toEqual({
      hydration: 64.7, starterFlour: 60, starterWater: 30, totalFlour: 510, totalWater: 330,
    });
  });

  it('defaults starter hydration to 100%', () => {
    expect(hydrationFromRecipe({ flour: 450, water: 300, starter: 100 }).hydration).toBe(70);
  });

  it('never returns NaN when there is no flour', () => {
    expect(hydrationFromRecipe({ flour: 0, water: 0 }).hydration).toBe(0);
  });
});

describe('splitDough', () => {
  it('splits a dough weight into flour and water that add back up', () => {
    expect(splitDough(900, 75)).toEqual({ flour: 514, water: 386 });
    expect(splitDough(1000, 100)).toEqual({ flour: 500, water: 500 });
  });
  it('returns zeros for invalid input', () => {
    expect(splitDough(NaN, 75)).toEqual({ flour: 0, water: 0 });
  });
});
