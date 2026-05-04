export const STYLES = [
  'sourdough',
  'baguette',
  'focaccia',
  'sandwich',
  'ciabatta',
  'brioche',
  'no-knead',
  'country-loaf',
] as const;

export const HYDRATIONS = [65, 75, 82] as const;

export const SCHEDULES = ['same-day', 'overnight', 'slow'] as const;

export type Style = (typeof STYLES)[number];
export type Hydration = (typeof HYDRATIONS)[number];
export type Schedule = (typeof SCHEDULES)[number];

export interface Combo {
  style: Style;
  hydration: Hydration;
  schedule: Schedule;
}

// Combos that are not generated. Reasoning kept in comments.
const SKIPS: ReadonlyArray<{ style: Style; schedule: Schedule; reason: string }> = [
  { style: 'sourdough', schedule: 'same-day', reason: 'Wild yeast needs longer schedule.' },
  { style: 'brioche', schedule: 'slow', reason: 'Enriched dough does not tolerate 24-48hr cold ferment.' },
  { style: 'sandwich', schedule: 'slow', reason: 'Commercial yeast overproofs at slow schedule.' },
  { style: 'no-knead', schedule: 'same-day', reason: 'Definitionally a long autolyse.' },
];

export function isSkipped(c: Combo): boolean {
  return SKIPS.some((s) => s.style === c.style && s.schedule === c.schedule);
}

export function allCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const style of STYLES) {
    for (const hydration of HYDRATIONS) {
      for (const schedule of SCHEDULES) {
        const c: Combo = { style, hydration, schedule };
        if (!isSkipped(c)) combos.push(c);
      }
    }
  }
  return combos;
}

export interface StyleMeta {
  displayName: string;
  cuisine: string;          // for schema.org recipeCuisine
  saltPercent: number;       // baker's percentage
  yeastType: 'starter' | 'instant' | 'enriched';
  hasOliveOil?: boolean;
  hasButter?: boolean;
  hasEggs?: boolean;
  hasMilk?: boolean;
  wholeGrainPercent?: number;
  bakeTemperatureF: number;
  bakeMinutes: number;
  difficulty: 1 | 2 | 3;
  // Article slugs (in src/content/styles/) relevant to this style. May be empty.
  relatedArticles: string[];
}

export const STYLE_META: Record<Style, StyleMeta> = {
  sourdough: {
    displayName: 'Sourdough',
    cuisine: 'European',
    saltPercent: 2,
    yeastType: 'starter',
    bakeTemperatureF: 500,
    bakeMinutes: 45,
    difficulty: 3,
    relatedArticles: ['sourdough-for-beginners'],
  },
  baguette: {
    displayName: 'Baguette',
    cuisine: 'French',
    saltPercent: 2,
    yeastType: 'instant',
    bakeTemperatureF: 475,
    bakeMinutes: 24,
    difficulty: 3,
    relatedArticles: ['classic-french-baguette'],
  },
  focaccia: {
    displayName: 'Focaccia',
    cuisine: 'Italian',
    saltPercent: 2.2,
    yeastType: 'instant',
    hasOliveOil: true,
    bakeTemperatureF: 425,
    bakeMinutes: 22,
    difficulty: 1,
    relatedArticles: ['high-hydration-focaccia'],
  },
  sandwich: {
    displayName: 'Sandwich Loaf',
    cuisine: 'American',
    saltPercent: 2,
    yeastType: 'instant',
    hasButter: true,
    hasMilk: true,
    bakeTemperatureF: 375,
    bakeMinutes: 35,
    difficulty: 1,
    relatedArticles: [],
  },
  ciabatta: {
    displayName: 'Ciabatta',
    cuisine: 'Italian',
    saltPercent: 2,
    yeastType: 'instant',
    hasOliveOil: true,
    bakeTemperatureF: 475,
    bakeMinutes: 22,
    difficulty: 3,
    relatedArticles: ['ciabatta-explained'],
  },
  brioche: {
    displayName: 'Brioche',
    cuisine: 'French',
    saltPercent: 1.8,
    yeastType: 'enriched',
    hasButter: true,
    hasEggs: true,
    hasMilk: true,
    bakeTemperatureF: 350,
    bakeMinutes: 35,
    difficulty: 3,
    relatedArticles: [],
  },
  'no-knead': {
    displayName: 'No-Knead Loaf',
    cuisine: 'European',
    saltPercent: 2,
    yeastType: 'instant',
    bakeTemperatureF: 475,
    bakeMinutes: 45,
    difficulty: 1,
    relatedArticles: [],
  },
  'country-loaf': {
    displayName: 'Country Loaf',
    cuisine: 'French',
    saltPercent: 2,
    yeastType: 'starter',
    wholeGrainPercent: 25,
    bakeTemperatureF: 475,
    bakeMinutes: 45,
    difficulty: 3,
    relatedArticles: ['country-loaf-pain-de-campagne'],
  },
};
