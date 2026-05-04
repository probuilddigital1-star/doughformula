import type { Combo } from '../data/recipes';
import { STYLE_META } from '../data/recipes';

const TOTAL_DOUGH_GRAMS = 1000; // Fixed yield target for all recipes.

export interface Ingredient {
  name: string;
  grams: number;
  bakerPercent: number;
}

export interface ScheduleStep {
  when: string;       // e.g. "Day 1, 8:00 AM" or "Hour 0"
  action: string;      // e.g. "Mix flour and water; autolyse 30 minutes"
}

export interface MethodStep {
  text: string;
}

export interface RecipeMeta {
  totalTimeISO: string;     // ISO 8601 duration, e.g. "PT12H"
  activeTimeISO: string;
  totalTimeLabel: string;   // human-readable, e.g. "12 hours"
  activeTimeLabel: string;
  yieldGrams: number;
  difficulty: 1 | 2 | 3;
}

export function computeIngredients(c: Combo): Ingredient[] {
  const meta = STYLE_META[c.style];
  const hyd = c.hydration / 100;

  // Derive flour weight so flour + water + salt + extras ≈ TOTAL_DOUGH_GRAMS.
  // Sum of multipliers for the simple lean dough = 1 + hyd + (salt%/100) + (yeast%/100)
  const yeastPercent = yeastPercentForStyleAndSchedule(c);
  const oilPercent = meta.hasOliveOil ? 5 : 0;
  const butterPercent = meta.hasButter ? 12 : 0;
  const eggPercent = meta.hasEggs ? 18 : 0;
  const milkPercent = meta.hasMilk ? (meta.hasEggs ? 12 : 25) : 0;

  const totalPercent =
    100 +
    c.hydration -
    milkPercent + // milk replaces water 1:1 for hydration purposes
    meta.saltPercent +
    yeastPercent +
    oilPercent +
    butterPercent +
    eggPercent +
    milkPercent;

  const flour = Math.round((TOTAL_DOUGH_GRAMS / totalPercent) * 100);
  const water = Math.round(flour * (c.hydration - milkPercent) / 100);
  const salt = round1(flour * meta.saltPercent / 100);
  const yeast = round1(flour * yeastPercent / 100);

  const ingredients: Ingredient[] = [];

  if (meta.wholeGrainPercent && meta.wholeGrainPercent > 0) {
    const whole = Math.round(flour * meta.wholeGrainPercent / 100);
    const white = flour - whole;
    ingredients.push({ name: 'Bread flour', grams: white, bakerPercent: 100 - meta.wholeGrainPercent });
    ingredients.push({ name: 'Whole wheat flour', grams: whole, bakerPercent: meta.wholeGrainPercent });
  } else {
    ingredients.push({ name: 'Bread flour', grams: flour, bakerPercent: 100 });
  }

  ingredients.push({ name: 'Water', grams: water, bakerPercent: c.hydration - milkPercent });

  if (milkPercent > 0) {
    const milk = Math.round(flour * milkPercent / 100);
    ingredients.push({ name: 'Milk', grams: milk, bakerPercent: milkPercent });
  }

  ingredients.push({ name: 'Salt', grams: salt, bakerPercent: meta.saltPercent });

  if (meta.yeastType === 'starter') {
    ingredients.push({ name: 'Active sourdough starter (100% hydration)', grams: yeast, bakerPercent: yeastPercent });
  } else if (meta.yeastType === 'enriched') {
    ingredients.push({ name: 'Instant yeast', grams: yeast, bakerPercent: yeastPercent });
  } else {
    ingredients.push({ name: 'Instant yeast', grams: yeast, bakerPercent: yeastPercent });
  }

  if (meta.hasOliveOil) {
    const oil = Math.round(flour * oilPercent / 100);
    ingredients.push({ name: 'Olive oil', grams: oil, bakerPercent: oilPercent });
  }
  if (meta.hasButter) {
    const butter = Math.round(flour * butterPercent / 100);
    ingredients.push({ name: 'Butter (softened)', grams: butter, bakerPercent: butterPercent });
  }
  if (meta.hasEggs) {
    const eggs = Math.round(flour * eggPercent / 100);
    ingredients.push({ name: 'Eggs (whole)', grams: eggs, bakerPercent: eggPercent });
  }

  return ingredients;
}

function yeastPercentForStyleAndSchedule(c: Combo): number {
  const meta = STYLE_META[c.style];
  if (meta.yeastType === 'starter') return 20;       // 20% starter for sourdough/country-loaf
  if (meta.yeastType === 'enriched') return 1.2;     // brioche
  // instant yeast — vary by schedule to compensate
  switch (c.schedule) {
    case 'same-day': return 0.8;
    case 'overnight': return 0.3;
    case 'slow': return 0.15;
    default: {
      const _exhaustive: never = c.schedule;
      throw new Error(`Unhandled schedule in yeastPercentForStyleAndSchedule: ${_exhaustive}`);
    }
  }
}

export function computeSchedule(c: Combo): ScheduleStep[] {
  const meta = STYLE_META[c.style];

  if (c.schedule === 'same-day') {
    return [
      { when: 'Hour 0', action: 'Mix flour, water, yeast. Autolyse 20 minutes.' },
      { when: 'Hour 0:20', action: 'Add salt, mix until smooth.' },
      { when: 'Hour 0:30', action: 'First fold.' },
      { when: 'Hour 1:00', action: 'Second fold.' },
      { when: 'Hour 1:30', action: 'Third fold.' },
      { when: 'Hour 2:00', action: 'Bulk ferment until visibly puffy.' },
      { when: 'Hour 3:30', action: 'Pre-shape, rest 20 minutes.' },
      { when: 'Hour 4:00', action: 'Final shape, proof 45-60 minutes.' },
      { when: 'Hour 5:00', action: `Score and bake at ${meta.bakeTemperatureF}°F for ${meta.bakeMinutes} minutes.` },
    ];
  }

  if (c.schedule === 'overnight') {
    return [
      { when: 'Day 1, 6:00 PM', action: 'Mix flour and water. Autolyse 30 minutes.' },
      { when: 'Day 1, 6:30 PM', action: meta.yeastType === 'starter' ? 'Add starter and salt. Mix until combined.' : 'Add yeast and salt. Mix until smooth.' },
      { when: 'Day 1, 7:00 PM', action: 'Stretch and fold every 30 minutes for 2 hours.' },
      { when: 'Day 1, 9:00 PM', action: 'Bulk ferment 1-2 more hours at room temperature.' },
      { when: 'Day 1, 10:30 PM', action: 'Shape, place in banneton or proofing vessel, refrigerate overnight.' },
      { when: 'Day 2, 7:00 AM', action: 'Pull from refrigerator. Preheat oven and Dutch oven (or stone) to bake temperature.' },
      { when: 'Day 2, 8:00 AM', action: `Score and bake at ${meta.bakeTemperatureF}°F covered for 25 minutes, uncovered for the remaining ${Math.max(0, meta.bakeMinutes - 25)} minutes.` },
    ];
  }

  // slow (24-48hr)
  return [
    { when: 'Day 1, evening', action: 'Mix flour and water. Autolyse 1 hour.' },
    { when: 'Day 1, evening', action: meta.yeastType === 'starter' ? 'Add starter and salt. Mix gently.' : 'Add yeast and salt. Mix gently.' },
    { when: 'Day 1, evening', action: 'Three folds, 30 minutes apart.' },
    { when: 'Day 1, night', action: 'Refrigerate the bulk dough overnight.' },
    { when: 'Day 2, morning', action: 'Pull from refrigerator. Bench rest 1 hour.' },
    { when: 'Day 2, midday', action: 'Pre-shape, rest 30 minutes, final shape into banneton.' },
    { when: 'Day 2, afternoon', action: 'Refrigerate the shaped loaf overnight.' },
    { when: 'Day 3, morning', action: 'Pull, preheat oven and baking vessel.' },
    { when: 'Day 3, morning', action: `Score and bake at ${meta.bakeTemperatureF}°F covered for 25 minutes, uncovered for the remaining ${Math.max(0, meta.bakeMinutes - 25)} minutes.` },
  ];
}

export function composeMethod(c: Combo): MethodStep[] {
  // For now, the method mirrors the schedule. Future expansion can add style-specific tweaks.
  return computeSchedule(c).map((s) => ({ text: `${s.when}: ${s.action}` }));
}

export function recipeMeta(c: Combo): RecipeMeta {
  const meta = STYLE_META[c.style];
  let totalHours: number;
  let activeMinutes: number;

  switch (c.schedule) {
    case 'same-day':
      totalHours = 5;
      activeMinutes = 60;
      break;
    case 'overnight':
      totalHours = 14;
      activeMinutes = 75;
      break;
    case 'slow':
      totalHours = 36;
      activeMinutes = 90;
      break;
    default: {
      const _exhaustive: never = c.schedule;
      throw new Error(`Unhandled schedule in recipeMeta: ${_exhaustive}`);
    }
  }

  return {
    totalTimeISO: `PT${totalHours}H`,
    activeTimeISO: `PT${activeMinutes}M`,
    totalTimeLabel: totalHours >= 24 ? `${totalHours} hours (over ~${Math.round(totalHours / 24) + 1} days)` : `${totalHours} hours`,
    activeTimeLabel: `${activeMinutes} minutes`,
    yieldGrams: TOTAL_DOUGH_GRAMS,
    difficulty: meta.difficulty,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
