// Pure hydration math for /hydration-calculator/. Grams round to the nearest gram and
// percents to one decimal (spec). Invalid input (NaN, negatives) is treated as zero so the
// page shows 0 rather than NaN while someone is mid-edit.

const clean = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export function roundG(n: number): number {
  return Math.round(n);
}

export function roundPct(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Water grams for a flour weight at a hydration percent. */
export function waterFromFlour(flourG: number, hydrationPct: number): number {
  return roundG((clean(flourG) * clean(hydrationPct)) / 100);
}

export interface RecipeHydration {
  hydration: number;
  starterFlour: number;
  starterWater: number;
  totalFlour: number;
  totalWater: number;
}

/** Total hydration of a recipe, counting the flour and water inside the starter.
 *  starterHydration defaults to 100% (equal parts flour and water). */
export function hydrationFromRecipe(i: {
  flour: number;
  water: number;
  starter?: number;
  starterHydration?: number;
}): RecipeHydration {
  const starter = clean(i.starter ?? 0);
  const sh = i.starterHydration === undefined ? 100 : clean(i.starterHydration);
  const starterFlourRaw = starter / (1 + sh / 100);
  const starterWaterRaw = starter - starterFlourRaw;
  const totalFlourRaw = clean(i.flour) + starterFlourRaw;
  const totalWaterRaw = clean(i.water) + starterWaterRaw;
  return {
    hydration: totalFlourRaw > 0 ? roundPct((totalWaterRaw / totalFlourRaw) * 100) : 0,
    starterFlour: roundG(starterFlourRaw),
    starterWater: roundG(starterWaterRaw),
    totalFlour: roundG(totalFlourRaw),
    totalWater: roundG(totalWaterRaw),
  };
}

/** Flour and water for a target dough weight. Water is total minus flour, so the two
 *  always add back up to the rounded total. */
export function splitDough(totalG: number, hydrationPct: number): { flour: number; water: number } {
  const total = roundG(clean(totalG));
  if (total === 0) return { flour: 0, water: 0 };
  const flour = roundG(total / (1 + clean(hydrationPct) / 100));
  return { flour, water: total - flour };
}
